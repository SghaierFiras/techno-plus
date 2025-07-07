export interface AnalyticsMetric {
  id: string;
  metric_name: string;
  metric_category: 'sales' | 'inventory' | 'customers' | 'suppliers' | 'tickets';
  metric_value: number;
  metric_unit?: string;
  date_recorded: string;
  time_period: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface DashboardMetrics {
  totalProducts: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalInventoryValue: number;
  dailySales: number;
  totalPurchases: number;
  totalCustomers: number;
  activeSuppliers: number;
  openTickets: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface AnalyticsFilters {
  dateFrom: string;
  dateTo: string;
  category: string;
  timePeriod: 'daily' | 'weekly' | 'monthly' | 'all_time';
}

export interface ProductAnalytics {
  id: string;
  sku: string;
  name: string;
  category_id: string;
  category_name: string;
  supplier_id?: string;
  supplier_name?: string;
  cost_price: number;
  selling_price: number;
  quantity_in_stock: number;
  min_stock_level: number;
  profit_per_unit: number;
  profit_margin_percentage: number;
  inventory_value: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  created_at: string;
  updated_at: string;
}

export interface SupplierAnalytics {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  rating: number;
  lead_time_days: number;
  minimum_order_amount: number;
  discount_percentage: number;
  total_products: number;
  total_inventory_value: number;
  avg_product_cost: number;
  low_stock_products: number;
  created_at: string;
  updated_at: string;
}