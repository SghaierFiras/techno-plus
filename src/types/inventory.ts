export interface Product {
  id: string;
  name: string;
  description?: string;
  product_code: string;
  barcode?: string;
  category_id: string;
  subcategory_id?: string;
  cost_price: number;
  selling_price: number;
  quantity_in_stock: number;
  min_stock_level: number;
  supplier?: string; // Legacy field, will be removed
  supplier_id?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  variants?: ProductVariant[];
  category?: Category;
  subcategory?: Category;
  supplier_info?: Supplier;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  value: string;
  additional_cost: number;
  quantity_in_stock: number;
  barcode?: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  name_fr?: string;
  parent_id?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  children?: Category[];
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  product_code: string;
  barcode: string;
  category_id: string;
  subcategory_id: string;
  cost_price: number;
  selling_price: number;
  quantity_in_stock: number;
  min_stock_level: number;
  supplier_id: string;
  image_url: string;
  variants: ProductVariantFormData[];
}

export interface ProductVariantFormData {
  name: string;
  value: string;
  additional_cost: number;
  quantity_in_stock: number;
  barcode: string;
}

export interface InventoryFilters {
  search: string;
  category_id: string;
  subcategory_id: string;
  supplier_id: string;
  low_stock_only: boolean;
  is_active: boolean;
}