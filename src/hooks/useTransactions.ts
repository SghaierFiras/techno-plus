import { useEffect, useState } from 'react';
import { Transaction } from '@/types/transactions';
import { supabase } from '@/lib/supabase';

export function useTransactions(filters?: {
  dateRange?: [string, string];
  customerId?: string;
  category?: string;
}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let query = supabase.from('transactions').select('*').order('created_at', { ascending: false });

    if (filters?.dateRange) {
      query = query.gte('date', filters.dateRange[0]).lte('date', filters.dateRange[1]);
    }
    if (filters?.customerId) {
      query = query.eq('customerId', filters.customerId);
    }
    if (filters?.category) {
      query = query.contains('items', [{ category: filters.category }]);
    }

    setLoading(true);
    query.then(({ data }) => {
      console.log('Supabase transactions raw data:', data);
      if (data && data.length > 0) {
        console.log('First transaction:', data[0]);
      }
      setTransactions(data || []);
      setLoading(false);
    });

    // Real-time updates
    const sub = supabase
      .channel('transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        // For simplicity, refetch all on any change
        query.then(({ data }) => setTransactions(data || []));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [JSON.stringify(filters)]);

  return { transactions, loading };
}

export async function getEarliestTransactionDate(): Promise<string | null> {
  const { data, error } = await supabase
    .from('transactions')
    .select('date')
    .order('date', { ascending: true })
    .limit(1);
  if (error || !data || data.length === 0) return null;
  return data[0].date;
} 