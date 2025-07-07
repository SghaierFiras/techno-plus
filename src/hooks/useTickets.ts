import { useState, useEffect } from 'react';
import { ServiceTicket, Customer, Technician, TicketFilters, TicketFormData, CustomerFormData, TicketStatusHistory } from '../types/tickets';
import { supabase } from '../lib/supabase';
import { syncManager } from '../lib/syncManager';
import { offlineDB } from '../lib/offlineDB';

export function useTickets() {
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Load data on mount
  useEffect(() => {
    loadData();
    
    // Subscribe to online status changes
    const unsubscribe = syncManager.onOnlineStatusChange(setIsOnline);
    return unsubscribe;
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isOnline) {
        try {
          await Promise.all([loadTickets(), loadCustomers(), loadTechnicians()]);
        } catch (serverError) {
          console.warn('Server load failed, falling back to offline data:', serverError);
          await loadOfflineData();
        }
      } else {
        await loadOfflineData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      try {
        await loadOfflineData();
      } catch (offlineError) {
        console.error('Failed to load offline data:', offlineError);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadOfflineData = async () => {
    const [offlineTickets, offlineCustomers, offlineTechnicians] = await Promise.all([
      offlineDB.getSetting('service_tickets') || [],
      offlineDB.getSetting('customers') || [],
      offlineDB.getSetting('technicians') || []
    ]);
    
    setTickets(offlineTickets);
    setCustomers(offlineCustomers);
    setTechnicians(offlineTechnicians);
  };

  const loadTickets = async () => {
    const { data, error } = await supabase
      .from('service_tickets')
      .select(`
        *,
        customer:customers(*),
        technician:technicians(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    setTickets(data || []);
    
    // Save to offline storage
    if (data) {
      await offlineDB.saveSetting('service_tickets', data);
    }
  };

  const loadCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name');

    if (error) throw error;

    setCustomers(data || []);
    
    // Save to offline storage
    if (data) {
      await offlineDB.saveSetting('customers', data);
    }
  };

  const loadTechnicians = async () => {
    const { data, error } = await supabase
      .from('technicians')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    setTechnicians(data || []);
    
    // Save to offline storage
    if (data) {
      await offlineDB.saveSetting('technicians', data);
    }
  };

  const generateTicketNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `TKT${year}${month}${day}${random}`;
  };

  const createTicket = async (ticketData: TicketFormData) => {
    try {
      const ticketNumber = generateTicketNumber();
      
      const newTicket = {
        ticket_number: ticketNumber,
        type: ticketData.type,
        customer_id: ticketData.customer_id,
        technician_id: ticketData.technician_id || null,
        device_info: ticketData.device_info || {},
        service_details: ticketData.service_details || {},
        status: 'new' as const,
        priority: ticketData.priority,
        price_quote: ticketData.price_quote,
        notes: ticketData.notes,
        files: [],
        paid: false
      };

      if (isOnline) {
        const { data, error } = await supabase
          .from('service_tickets')
          .insert([newTicket])
          .select(`
            *,
            customer:customers(*),
            technician:technicians(*)
          `)
          .single();

        if (error) throw error;
        
        await loadTickets();
        return data;
      } else {
        // Queue for sync when online
        await syncManager.queueAction({
          type: 'CREATE_TICKET',
          data: newTicket
        });
        
        // Add to local storage temporarily
        const tempTicket = {
          ...newTicket,
          id: `temp_${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as ServiceTicket;
        
        const updatedTickets = [tempTicket, ...tickets];
        setTickets(updatedTickets);
        await offlineDB.saveSetting('service_tickets', updatedTickets);
        
        return tempTicket;
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create ticket');
    }
  };

  const updateTicket = async (id: string, updates: Partial<ServiceTicket>) => {
    try {
      if (isOnline) {
        const { data, error } = await supabase
          .from('service_tickets')
          .update(updates)
          .eq('id', id)
          .select(`
            *,
            customer:customers(*),
            technician:technicians(*)
          `)
          .single();

        if (error) throw error;
        
        await loadTickets();
        return data;
      } else {
        // Queue for sync when online
        await syncManager.queueAction({
          type: 'UPDATE_TICKET',
          id,
          data: updates
        });
        
        // Update local storage
        const updatedTickets = tickets.map(t => 
          t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
        );
        setTickets(updatedTickets);
        await offlineDB.saveSetting('service_tickets', updatedTickets);
        
        return updatedTickets.find(t => t.id === id);
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update ticket');
    }
  };

  const createCustomer = async (customerData: CustomerFormData) => {
    try {
      if (isOnline) {
        const { data, error } = await supabase
          .from('customers')
          .insert([customerData])
          .select()
          .single();

        if (error) throw error;
        
        await loadCustomers();
        return data;
      } else {
        // Queue for sync when online
        await syncManager.queueAction({
          type: 'CREATE_CUSTOMER',
          data: customerData
        });
        
        // Add to local storage temporarily
        const tempCustomer = {
          ...customerData,
          id: `temp_${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Customer;
        
        const updatedCustomers = [...customers, tempCustomer];
        setCustomers(updatedCustomers);
        await offlineDB.saveSetting('customers', updatedCustomers);
        
        return tempCustomer;
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create customer');
    }
  };

  const getTicketStatusHistory = async (ticketId: string): Promise<TicketStatusHistory[]> => {
    if (isOnline) {
      try {
        const { data, error } = await supabase
          .from('ticket_status_history')
          .select('*')
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.warn('Failed to load status history:', error);
      }
    }
    
    // Fallback to offline data or empty array
    return [];
  };

  const filterTickets = (filters: TicketFilters): ServiceTicket[] => {
    return tickets.filter(ticket => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesTicketNumber = ticket.ticket_number.toLowerCase().includes(searchTerm);
        const matchesCustomer = ticket.customer?.name.toLowerCase().includes(searchTerm) || 
                               ticket.customer?.phone.includes(searchTerm);
        const matchesNotes = ticket.notes?.toLowerCase().includes(searchTerm);
        
        if (!matchesTicketNumber && !matchesCustomer && !matchesNotes) {
          return false;
        }
      }
      
      // Type filter
      if (filters.type !== 'all' && ticket.type !== filters.type) {
        return false;
      }
      
      // Status filter
      if (filters.status && ticket.status !== filters.status) {
        return false;
      }
      
      // Priority filter
      if (filters.priority && ticket.priority !== filters.priority) {
        return false;
      }
      
      // Technician filter
      if (filters.technician_id && ticket.technician_id !== filters.technician_id) {
        return false;
      }
      
      // Date range filter
      if (filters.date_from) {
        const ticketDate = new Date(ticket.created_at);
        const fromDate = new Date(filters.date_from);
        if (ticketDate < fromDate) {
          return false;
        }
      }
      
      if (filters.date_to) {
        const ticketDate = new Date(ticket.created_at);
        const toDate = new Date(filters.date_to);
        toDate.setHours(23, 59, 59, 999); // End of day
        if (ticketDate > toDate) {
          return false;
        }
      }
      
      return true;
    });
  };

  const searchCustomers = async (query: string): Promise<Customer[]> => {
    if (isOnline) {
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .or(`name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
          .limit(10);

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.warn('Online customer search failed, using offline search:', error);
      }
    }
    
    // Fallback to offline search
    const lowerQuery = query.toLowerCase();
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(lowerQuery) ||
      customer.phone.includes(query) ||
      (customer.email && customer.email.toLowerCase().includes(lowerQuery))
    ).slice(0, 10);
  };

  return {
    tickets,
    customers,
    technicians,
    loading,
    error,
    isOnline,
    createTicket,
    updateTicket,
    createCustomer,
    getTicketStatusHistory,
    filterTickets,
    searchCustomers,
    refreshData: loadData
  };
}