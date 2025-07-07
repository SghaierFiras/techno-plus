export interface TransactionItem {
  productId: string;
  name: string;
  quantity: number;
  category?: string;
}

export interface Transaction {
  id: string;
  customerId?: string;
  customerName?: string;
  supplierId?: string;
  supplierName?: string;
  items: TransactionItem[];
  total: number;
  discount_amount?: number;
  discountType?: 'amount' | 'percent';
  paymentMethod: string;
  created_at: string; // ISO string
} 