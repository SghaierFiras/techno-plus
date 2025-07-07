import { useState, useEffect } from 'react';
import { Supplier, SupplierFormData, SupplierFilters, SupplierPerformance, SupplierActivityLog } from '../types/supplier';
import { supabase } from '../lib/supabase';
import { syncManager } from '../lib/syncManager';
import { offlineDB } from '../lib/offlineDB';

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    loadSuppliers();
    
    const unsubscribe = syncManager.onOnlineStatusChange(setIsOnline);
    return unsubscribe;
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isOnline) {
        try {
          const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .order('name');

          if (error) throw error;
          
          setSuppliers(data || []);
          
          if (data) {
            await offlineDB.saveSetting('suppliers', data);
          }
        } catch (serverError) {
          console.warn('Server load failed, falling back to offline data:', serverError);
          await loadOfflineSuppliers();
        }
      } else {
        await loadOfflineSuppliers();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load suppliers');
      try {
        await loadOfflineSuppliers();
      } catch (offlineError) {
        console.error('Failed to load offline suppliers:', offlineError);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadOfflineSuppliers = async () => {
    const offlineSuppliers = await offlineDB.getSetting('suppliers') || [];
    setSuppliers(offlineSuppliers);
  };

  const createSupplier = async (supplierData: SupplierFormData) => {
    try {
      if (isOnline) {
        const { data, error } = await supabase
          .from('suppliers')
          .insert([supplierData])
          .select()
          .single();

        if (error) throw error;
        
        await loadSuppliers();
        return data;
      } else {
        await syncManager.queueAction({
          type: 'CREATE_SUPPLIER',
          data: supplierData
        });
        
        const tempSupplier = {
          ...supplierData,
          id: `temp_${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true
        } as Supplier;
        
        const updatedSuppliers = [...suppliers, tempSupplier];
        setSuppliers(updatedSuppliers);
        await offlineDB.saveSetting('suppliers', updatedSuppliers);
        
        return tempSupplier;
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create supplier');
    }
  };

  const updateSupplier = async (id: string, supplierData: Partial<SupplierFormData>) => {
    try {
      if (isOnline) {
        const { data, error } = await supabase
          .from('suppliers')
          .update(supplierData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        
        await loadSuppliers();
        return data;
      } else {
        await syncManager.queueAction({
          type: 'UPDATE_SUPPLIER',
          id,
          data: supplierData
        });
        
        const updatedSuppliers = suppliers.map(s => 
          s.id === id ? { ...s, ...supplierData, updated_at: new Date().toISOString() } : s
        );
        setSuppliers(updatedSuppliers);
        await offlineDB.saveSetting('suppliers', updatedSuppliers);
        
        return updatedSuppliers.find(s => s.id === id);
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update supplier');
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      if (isOnline) {
        const { error } = await supabase
          .from('suppliers')
          .update({ is_active: false })
          .eq('id', id);

        if (error) throw error;
        
        await loadSuppliers();
      } else {
        await syncManager.queueAction({
          type: 'DELETE_SUPPLIER',
          id
        });
        
        const updatedSuppliers = suppliers.map(s => 
          s.id === id ? { ...s, is_active: false } : s
        );
        setSuppliers(updatedSuppliers);
        await offlineDB.saveSetting('suppliers', updatedSuppliers);
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete supplier');
    }
  };

  const filterSuppliers = (filters: SupplierFilters): Supplier[] => {
    return suppliers.filter(supplier => {
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const name = supplier.name.toLowerCase();
        const contactPerson = (supplier.contact_person || '').toLowerCase();
        const email = (supplier.email || '').toLowerCase();
        
        if (!name.includes(searchTerm) && 
            !contactPerson.includes(searchTerm) && 
            !email.includes(searchTerm)) {
          return false;
        }
      }
      
      if (filters.rating_min && supplier.rating < filters.rating_min) {
        return false;
      }
      
      if (filters.lead_time_max && supplier.lead_time_days > filters.lead_time_max) {
        return false;
      }
      
      if (filters.is_active !== undefined && supplier.is_active !== filters.is_active) {
        return false;
      }
      
      return true;
    });
  };

  const getSupplierPerformance = async (supplierId: string): Promise<SupplierPerformance[]> => {
    if (isOnline) {
      try {
        const { data, error } = await supabase
          .from('supplier_performance')
          .select('*')
          .eq('supplier_id', supplierId)
          .order('measurement_date', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.warn('Failed to load supplier performance:', error);
      }
    }
    
    return [];
  };

  const addSupplierPerformance = async (performance: Omit<SupplierPerformance, 'id' | 'created_at'>) => {
    if (isOnline) {
      try {
        const { data, error } = await supabase
          .from('supplier_performance')
          .insert([performance])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Failed to add supplier performance:', error);
        throw error;
      }
    } else {
      await syncManager.queueAction({
        type: 'ADD_SUPPLIER_PERFORMANCE',
        data: performance
      });
    }
  };

  const getSupplierActivityLog = async (supplierId: string): Promise<SupplierActivityLog[]> => {
    if (isOnline) {
      try {
        const { data, error } = await supabase
          .from('supplier_activity_log')
          .select('*')
          .eq('supplier_id', supplierId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.warn('Failed to load supplier activity log:', error);
      }
    }
    
    return [];
  };

  const addSupplierActivity = async (activity: Omit<SupplierActivityLog, 'id' | 'created_at'>) => {
    if (isOnline) {
      try {
        const { data, error } = await supabase
          .from('supplier_activity_log')
          .insert([activity])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Failed to add supplier activity:', error);
        throw error;
      }
    } else {
      await syncManager.queueAction({
        type: 'ADD_SUPPLIER_ACTIVITY',
        data: activity
      });
    }
  };

  return {
    suppliers,
    loading,
    error,
    isOnline,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    filterSuppliers,
    getSupplierPerformance,
    addSupplierPerformance,
    getSupplierActivityLog,
    addSupplierActivity,
    refreshData: loadSuppliers
  };
}