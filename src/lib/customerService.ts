import { supabase } from './supabase';
import { offlineDB } from './offlineDB';
import { Customer, CustomerFormData, CustomerFilters, CustomerStats, CustomerServiceTicket } from '../types/customer';
import { ServiceTicket } from '../types/tickets';

class CustomerService {
  private readonly TABLE_NAME = 'customers';

  // Create a new customer
  async createCustomer(customerData: CustomerFormData): Promise<Customer> {
    const customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'> = {
      ...customerData,
    };

    try {
      // Try online first
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .insert({
          ...customerData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Save to offline DB as backup
      await offlineDB.saveCustomer(data);
      
      return data;
    } catch (error) {
      console.warn('Online create failed, using offline mode:', error);
      
      // Generate offline ID
      const offlineId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const offlineCustomer: Customer = {
        ...customer,
        id: offlineId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Save to offline DB
      await offlineDB.saveCustomer(offlineCustomer);
      
      // Add to sync queue
      await offlineDB.addToSyncQueue({
        type: 'create_customer',
        data: customerData,
        id: offlineId,
      });

      return offlineCustomer;
    }
  }

  // Get all customers with optional filters
  async getCustomers(filters?: CustomerFilters): Promise<Customer[]> {
    try {
      let query = supabase.from(this.TABLE_NAME).select('*');

      if (filters) {
        if (filters.search) {
          query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
        }
        if (filters.customer_type !== 'all') {
          query = query.eq('customer_type', filters.customer_type);
        }
        if (filters.date_from) {
          query = query.gte('created_at', filters.date_from);
        }
        if (filters.date_to) {
          query = query.lte('created_at', filters.date_to);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Update offline DB
      if (data) {
        await offlineDB.saveCustomers(data);
      }

      return data || [];
    } catch (error) {
      console.warn('Online fetch failed, using offline data:', error);
      
      // Get from offline DB
      const customers = await offlineDB.getCustomers();
      
      // Apply filters locally
      if (filters) {
        return this.filterCustomersLocally(customers, filters);
      }
      
      return customers;
    }
  }

  // Get a single customer by ID
  async getCustomerById(id: string): Promise<Customer | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.warn('Online fetch failed, using offline data:', error);
      
      // Get from offline DB
      const customer = await offlineDB.getCustomerById(id);
      return customer || null;
    }
  }

  // Update a customer
  async updateCustomer(id: string, customerData: Partial<CustomerFormData>): Promise<Customer> {
    const updateData = {
      ...customerData,
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update offline DB
      await offlineDB.saveCustomer(data);
      
      return data;
    } catch (error) {
      console.warn('Online update failed, using offline mode:', error);
      
      // Get existing customer
      const existingCustomer = await offlineDB.getCustomerById(id);
      if (!existingCustomer) {
        throw new Error('Customer not found');
      }

      // Update customer
      const updatedCustomer: Customer = {
        ...existingCustomer,
        ...updateData,
      };

      // Save to offline DB
      await offlineDB.saveCustomer(updatedCustomer);
      
      // Add to sync queue
      await offlineDB.addToSyncQueue({
        type: 'update_customer',
        data: { id, ...updateData },
        id: `update_${id}_${Date.now()}`,
      });

      return updatedCustomer;
    }
  }

  // Delete a customer
  async deleteCustomer(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Remove from offline DB
      await offlineDB.deleteCustomer(id);
    } catch (error) {
      console.warn('Online delete failed, using offline mode:', error);
      
      // Remove from offline DB
      await offlineDB.deleteCustomer(id);
      
      // Add to sync queue
      await offlineDB.addToSyncQueue({
        type: 'delete_customer',
        data: { id },
        id: `delete_${id}_${Date.now()}`,
      });
    }
  }

  // Get customer statistics
  async getCustomerStats(customerId: string): Promise<CustomerStats> {
    try {
      // Get customer's service tickets
      const { data: tickets, error } = await supabase
        .from('service_tickets')
        .select('*')
        .eq('customer_id', customerId);

      if (error) throw error;

      return this.calculateCustomerStats(tickets || []);
    } catch (error) {
      console.warn('Online stats fetch failed:', error);
      
      // Get from offline DB
      const tickets = await offlineDB.getCustomerTickets(customerId);
      return this.calculateCustomerStats(tickets);
    }
  }

  // Get customer's service tickets
  async getCustomerTickets(customerId: string): Promise<CustomerServiceTicket[]> {
    try {
      const { data, error } = await supabase
        .from('service_tickets')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.warn('Online tickets fetch failed, using offline data:', error);
      
      // Get from offline DB
      return await offlineDB.getCustomerTickets(customerId);
    }
  }

  // Search customers
  async searchCustomers(query: string): Promise<Customer[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
        .order('full_name');

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.warn('Online search failed, using offline data:', error);
      
      // Get from offline DB and filter locally
      const customers = await offlineDB.getCustomers();
      return this.filterCustomersLocally(customers, { search: query });
    }
  }

  // Private helper methods
  private filterCustomersLocally(customers: Customer[], filters: CustomerFilters): Customer[] {
    return customers.filter(customer => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          customer.full_name.toLowerCase().includes(searchLower) ||
          customer.email.toLowerCase().includes(searchLower) ||
          customer.phone.includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Customer type filter
      if (filters.customer_type !== 'all' && customer.customer_type !== filters.customer_type) {
        return false;
      }

      // Date range filter
      if (filters.date_from && customer.created_at < filters.date_from) {
        return false;
      }
      if (filters.date_to && customer.created_at > filters.date_to) {
        return false;
      }

      return true;
    });
  }

  private calculateCustomerStats(tickets: ServiceTicket[]): CustomerStats {
    const completedTickets = tickets.filter(t => t.status === 'completed' || t.status === 'delivered');
    const totalSpent = completedTickets.reduce((sum, ticket) => sum + (ticket.final_price || ticket.price_quote), 0);
    const lastVisit = tickets.length > 0 ? Math.max(...tickets.map(t => new Date(t.created_at).getTime())) : 0;
    const averageTicketValue = completedTickets.length > 0 ? totalSpent / completedTickets.length : 0;

    return {
      total_tickets: tickets.length,
      completed_tickets: completedTickets.length,
      total_spent: totalSpent,
      last_visit: lastVisit > 0 ? new Date(lastVisit).toISOString() : '',
      average_ticket_value: averageTicketValue,
    };
  }
}

export const customerService = new CustomerService(); 