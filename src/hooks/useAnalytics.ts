import { useState, useEffect } from 'react';
import { AnalyticsMetric, DashboardMetrics, ChartDataPoint, AnalyticsFilters, ProductAnalytics, SupplierAnalytics } from '../types/analytics';
import { supabase } from '../lib/supabase';
import { syncManager } from '../lib/syncManager';
import { offlineDB } from '../lib/offlineDB';

export function useAnalytics() {
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics>({
    totalProducts: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalInventoryValue: 0,
    dailySales: 0,
    totalPurchases: 0,
    totalCustomers: 0,
    activeSuppliers: 0,
    openTickets: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    loadAnalytics();
    
    const unsubscribe = syncManager.onOnlineStatusChange(setIsOnline);
    return unsubscribe;
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isOnline) {
        try {
          await Promise.all([
            loadMetrics(),
            loadDashboardMetrics()
          ]);
        } catch (serverError) {
          console.warn('Server load failed, falling back to offline data:', serverError);
          await loadOfflineAnalytics();
        }
      } else {
        await loadOfflineAnalytics();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
      try {
        await loadOfflineAnalytics();
      } catch (offlineError) {
        console.error('Failed to load offline analytics:', offlineError);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadOfflineAnalytics = async () => {
    const offlineMetrics = (await offlineDB.getSetting('analytics_metrics')) as unknown as AnalyticsMetric[] || [];
    const offlineDashboard = (await offlineDB.getSetting('dashboard_metrics')) as unknown as DashboardMetrics || dashboardMetrics;
    setMetrics(offlineMetrics);
    setDashboardMetrics(offlineDashboard);
  };

  const loadMetrics = async () => {
    const { data, error } = await supabase
      .from('analytics_metrics')
      .select('*')
      .order('date_recorded', { ascending: false })
      .limit(100);

    if (error) throw error;
    
    setMetrics(data || []);
    
    if (data) {
      await offlineDB.saveSetting('analytics_metrics', data as unknown as Record<string, unknown>);
    }
  };

  const loadDashboardMetrics = async () => {
    // Get latest metrics for dashboard
    const { data, error } = await supabase
      .from('analytics_metrics')
      .select('metric_name, metric_value')
      .eq('date_recorded', new Date().toISOString().split('T')[0])
      .in('metric_name', [
        'total_products',
        'low_stock_items',
        'out_of_stock_items',
        'total_inventory_value',
        'daily_sales',
        'total_purchases',
        'total_customers',
        'active_suppliers',
        'open_tickets'
      ]);

    if (error) throw error;

    const metricsMap = (data || []).reduce((acc, metric) => {
      acc[metric.metric_name] = metric.metric_value;
      return acc;
    }, {} as Record<string, number>);

    const dashboard: DashboardMetrics = {
      totalProducts: metricsMap.total_products || 0,
      lowStockItems: metricsMap.low_stock_items || 0,
      outOfStockItems: metricsMap.out_of_stock_items || 0,
      totalInventoryValue: metricsMap.total_inventory_value || 0,
      dailySales: metricsMap.daily_sales || 0,
      totalPurchases: metricsMap.total_purchases || 0,
      totalCustomers: metricsMap.total_customers || 0,
      activeSuppliers: metricsMap.active_suppliers || 0,
      openTickets: metricsMap.open_tickets || 0
    };

    setDashboardMetrics(dashboard);
    await offlineDB.saveSetting('dashboard_metrics', dashboard as unknown as Record<string, unknown>);
  };

  const getChartData = async (
    metricName: string, 
    filters: AnalyticsFilters
  ): Promise<ChartDataPoint[]> => {
    if (isOnline) {
      try {
        const { data, error } = await supabase
          .from('analytics_metrics')
          .select('date_recorded, metric_value')
          .eq('metric_name', metricName)
          .gte('date_recorded', filters.dateFrom)
          .lte('date_recorded', filters.dateTo)
          .order('date_recorded');

        if (error) throw error;

        return (data || []).map(item => ({
          date: item.date_recorded,
          value: item.metric_value
        }));
      } catch (error) {
        console.warn('Failed to load chart data online:', error);
      }
    }

    // Fallback to offline data
    const offlineMetrics = (await offlineDB.getSetting('analytics_metrics')) as unknown as AnalyticsMetric[] || [];
    return offlineMetrics
      .filter((metric: AnalyticsMetric) => 
        metric.metric_name === metricName &&
        metric.date_recorded >= filters.dateFrom &&
        metric.date_recorded <= filters.dateTo
      )
      .map((metric: AnalyticsMetric) => ({
        date: metric.date_recorded,
        value: metric.metric_value
      }));
  };

  const getProductAnalytics = async (): Promise<ProductAnalytics[]> => {
    if (isOnline) {
      try {
        const { data, error } = await supabase
          .from('product_analytics')
          .select('*')
          .order('inventory_value', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.warn('Failed to load product analytics online:', error);
      }
    }

    // Fallback to basic product data
    const products = await syncManager.getOfflineProducts();
    return products.map(product => ({
      id: product.id,
      sku: product.product_code, // Fallback to product_code if SKU not available
      name: product.name,
      category_id: product.category_id,
      category_name: product.category?.name || '',
      supplier_id: product.supplier_id,
      supplier_name: product.supplier_info?.name || product.supplier,
      cost_price: product.cost_price,
      selling_price: product.selling_price,
      quantity_in_stock: product.quantity_in_stock,
      min_stock_level: product.min_stock_level,
      profit_per_unit: product.selling_price - product.cost_price,
      profit_margin_percentage: ((product.selling_price - product.cost_price) / product.selling_price) * 100,
      inventory_value: product.quantity_in_stock * product.cost_price,
      stock_status: product.quantity_in_stock === 0 ? 'out_of_stock' : 
                   product.quantity_in_stock <= product.min_stock_level ? 'low_stock' : 'in_stock',
      created_at: product.created_at,
      updated_at: product.updated_at
    }));
  };

  const getSupplierAnalytics = async (): Promise<SupplierAnalytics[]> => {
    if (isOnline) {
      try {
        const { data, error } = await supabase
          .from('supplier_analytics')
          .select('*')
          .order('total_inventory_value', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.warn('Failed to load supplier analytics online:', error);
      }
    }

    // Fallback to basic supplier data
    const suppliers = (await offlineDB.getSetting('suppliers')) as unknown as SupplierAnalytics[] || [];
    return suppliers.map((supplier: SupplierAnalytics) => ({
      id: supplier.id,
      name: supplier.name,
      contact_person: supplier.contact_person,
      email: supplier.email,
      phone: supplier.phone,
      rating: supplier.rating || 0,
      lead_time_days: supplier.lead_time_days || 7,
      minimum_order_amount: supplier.minimum_order_amount || 0,
      discount_percentage: supplier.discount_percentage || 0,
      total_products: 0,
      total_inventory_value: 0,
      avg_product_cost: 0,
      low_stock_products: 0,
      created_at: supplier.created_at,
      updated_at: supplier.updated_at
    }));
  };

  const updateMetrics = async () => {
    if (isOnline) {
      try {
        const { error } = await supabase.rpc('update_analytics_metrics');
        if (error) throw error;
        await loadAnalytics();
      } catch (error) {
        console.error('Failed to update metrics:', error);
      }
    }
  };

  // Get the earliest analytics date (for 'All Time' filter)
  const getEarliestAnalyticsDate = async (): Promise<string> => {
    if (isOnline) {
      try {
        const { data, error } = await supabase
          .from('analytics_metrics')
          .select('date_recorded')
          .order('date_recorded', { ascending: true })
          .limit(1);
        if (error) throw error;
        if (data && data.length > 0) return data[0].date_recorded;
      } catch (error) {
        console.warn('Failed to get earliest analytics date online:', error);
      }
    }
    // Fallback to offline data
    const offlineMetrics = (await offlineDB.getSetting('analytics_metrics')) as unknown as AnalyticsMetric[] || [];
    if (offlineMetrics.length > 0) {
      const minDate = offlineMetrics.reduce((min, m) => m.date_recorded < min ? m.date_recorded : min, offlineMetrics[0].date_recorded);
      return minDate;
    }
    // Default fallback: 1 year ago
    return new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  };

  return {
    metrics,
    dashboardMetrics,
    loading,
    error,
    isOnline,
    getChartData,
    getProductAnalytics,
    getSupplierAnalytics,
    updateMetrics,
    refreshData: loadAnalytics,
    getEarliestAnalyticsDate,
  };
}