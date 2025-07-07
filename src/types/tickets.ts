export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialization?: string;
  is_active: boolean;
  created_at: string;
}

export interface DeviceInfo {
  brand: string;
  model: string;
  serialNumber?: string;
  problemDescription: string;
  condition?: string;
  accessories?: string[];
}

export interface ServiceDetails {
  serviceType: string;
  provider?: string;
  accountNumber?: string;
  amount?: number;
  description?: string;
  additionalInfo?: string;
}

export interface ServiceTicket {
  id: string;
  ticket_number: string;
  type: 'repair' | 'digital_service';
  customer_id: string;
  technician_id?: string;
  device_info?: DeviceInfo;
  service_details?: ServiceDetails;
  status: 'new' | 'in_progress' | 'awaiting_parts' | 'completed' | 'delivered' | 'canceled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  price_quote: number;
  final_price?: number;
  paid: boolean;
  notes?: string;
  files: string[];
  created_at: string;
  updated_at: string;
  customer?: Customer;
  technician?: Technician;
}

export interface TicketStatusHistory {
  id: string;
  ticket_id: string;
  old_status?: string;
  new_status: string;
  changed_by?: string;
  notes?: string;
  created_at: string;
}

export interface TicketFormData {
  type: 'repair' | 'digital_service';
  customer_id: string;
  device_info?: DeviceInfo;
  service_details?: ServiceDetails;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  price_quote: number;
  notes?: string;
  technician_id?: string;
}

export interface TicketFilters {
  search: string;
  type: 'all' | 'repair' | 'digital_service';
  status: string;
  priority: string;
  technician_id: string;
  date_from: string;
  date_to: string;
}

export interface CustomerFormData {
  name: string;
  email?: string;
  phone: string;
  address?: string;
}

// Service types for digital services
export const DIGITAL_SERVICE_TYPES = [
  'Bill Payment',
  'Mobile Recharge',
  'Internet Subscription',
  'TV Subscription',
  'SIM Activation',
  'Software Installation',
  'Data Transfer',
  'Account Setup',
  'Technical Support',
  'Other'
] as const;

// Common providers for digital services
export const SERVICE_PROVIDERS = [
  'Ooredoo',
  'Orange',
  'Tunisie Telecom',
  'Netflix',
  'Canal+',
  'BeIN Sports',
  'Spotify',
  'Microsoft',
  'Google',
  'Apple',
  'Other'
] as const;