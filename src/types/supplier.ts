export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  tax_id?: string;
  payment_terms?: string;
  lead_time_days: number;
  minimum_order_amount: number;
  discount_percentage: number;
  rating: number;
  notes?: string;
  preferred_contact_method: 'email' | 'phone' | 'both';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplierPerformance {
  id: string;
  supplier_id: string;
  metric_type: 'delivery_time' | 'quality_rating' | 'order_accuracy' | 'communication';
  metric_value: number;
  measurement_date: string;
  notes?: string;
  created_at: string;
}

export interface SupplierActivityLog {
  id: string;
  supplier_id: string;
  activity_type: 'order_placed' | 'delivery_received' | 'payment_made' | 'communication' | 'rating_updated' | 'contract_updated';
  description: string;
  reference_id?: string;
  metadata?: Record<string, any>;
  created_by?: string;
  created_at: string;
}

export interface SupplierFormData {
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  tax_id: string;
  payment_terms: string;
  lead_time_days: number;
  minimum_order_amount: number;
  discount_percentage: number;
  rating: number;
  notes: string;
  preferred_contact_method: 'email' | 'phone' | 'both';
}

export interface SupplierFilters {
  search: string;
  rating_min: number;
  lead_time_max: number;
  is_active: boolean;
}