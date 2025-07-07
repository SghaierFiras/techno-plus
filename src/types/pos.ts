export interface CartItem {
  id: string;
  product_id: string;
  variant_id?: string;
  name: string;
  product_code: string;
  barcode?: string;
  price: number;
  quantity: number;
  discount_amount: number;
  discount_percentage: number;
  subtotal: number;
  image_url?: string;
  variant_name?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discount_amount: number;
  discount_percentage: number;
  tax_amount: number;
  total: number;
}

export interface PaymentMethod {
  type: 'cash' | 'card' | 'mixed';
  amount: number;
  card_amount?: number;
  cash_amount?: number;
  change_due?: number;
}

export interface Transaction {
  id: string;
  transaction_number: string;
  items: CartItem[];
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  payment_method: PaymentMethod;
  customer_id?: string;
  cashier_id?: string;
  notes?: string;
  created_at: string;
  status: 'completed' | 'pending' | 'cancelled' | 'refunded';
}

export interface Receipt {
  transaction: Transaction;
  store_info: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  customer_info?: {
    name: string;
    email: string;
  };
}

export interface POSSettings {
  tax_rate: number;
  currency: string;
  auto_print_receipt: boolean;
  barcode_scanner_enabled: boolean;
  sound_enabled: boolean;
  default_payment_method: 'cash' | 'card';
}