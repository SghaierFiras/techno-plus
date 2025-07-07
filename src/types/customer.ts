export interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  customer_type: 'individual' | 'business';
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerFormData {
  full_name: string;
  email: string;
  phone: string;
  customer_type: 'individual' | 'business';
  address?: string;
}

export interface CustomerFilters {
  search: string;
  customer_type: 'all' | 'individual' | 'business';
  date_from: string;
  date_to: string;
}

export interface CustomerHistory {
  id: string;
  customer_id: string;
  action: 'created' | 'updated' | 'deleted';
  changes?: Record<string, string | number | boolean>;
  performed_by?: string;
  created_at: string;
}

export interface CustomerServiceTicket {
  id: string;
  ticket_number: string;
  type: 'repair' | 'digital_service';
  status: 'new' | 'in_progress' | 'awaiting_parts' | 'completed' | 'delivered' | 'canceled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  price_quote: number;
  final_price?: number;
  paid: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerStats {
  total_tickets: number;
  completed_tickets: number;
  total_spent: number;
  last_visit: string;
  average_ticket_value: number;
} 