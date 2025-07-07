import { useState, useEffect } from 'react';
import { Product, Category, Supplier, InventoryFilters } from '../types/inventory';
import { supabase } from '../lib/supabase';
import { syncManager } from '../lib/syncManager';
import { offlineDB } from '../lib/offlineDB';
import { useToast } from './useToast';

export function useInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  // Load data on mount
  useEffect(() => {
    loadData();
    
    // Subscribe to online status changes
    const unsubscribe = syncManager.onOnlineStatusChange(setIsOnline);
    return unsubscribe;
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isOnline) {
        try {
          await Promise.all([loadProducts(), loadCategories(), loadSuppliers()]);
        } catch (serverError) {
          console.warn('Server load failed, falling back to offline data:', serverError);
          await loadOfflineData();
        }
      } else {
        await loadOfflineData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      try {
        await loadOfflineData();
      } catch (offlineError) {
        console.error('Failed to load offline data:', offlineError);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadOfflineData = async () => {
    const [offlineProducts, offlineCategories, offlineSuppliers] = await Promise.all([
      syncManager.getOfflineProducts(),
      syncManager.getOfflineCategories(),
      offlineDB.getSetting('suppliers') || []
    ]);
    
    setProducts(offlineProducts);
    setCategories(offlineCategories);
    setSuppliers(offlineSuppliers);
  };

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories!products_category_id_fkey(*),
        subcategory:categories!products_subcategory_id_fkey(*),
        supplier_info:suppliers!products_supplier_id_fkey(*),
        variants:product_variants(*)
      `)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    
    setProducts(data || []);
    
    // Save to offline storage
    if (data) {
      await offlineDB.saveProducts(data);
    }
  };

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    // Organize categories with subcategories
    const categoriesMap = new Map<string, Category>();
    const rootCategories: Category[] = [];

    data?.forEach(cat => {
      categoriesMap.set(cat.id, { ...cat, children: [] });
    });

    data?.forEach(cat => {
      const category = categoriesMap.get(cat.id)!;
      if (cat.parent_id) {
        const parent = categoriesMap.get(cat.parent_id);
        if (parent) {
          parent.children!.push(category);
        }
      } else {
        rootCategories.push(category);
      }
    });

    setCategories(rootCategories);
    
    // Save to offline storage
    await offlineDB.saveCategories(rootCategories);
  };

  const loadSuppliers = async () => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    setSuppliers(data || []);
    
    // Save to offline storage
    if (data) {
      await offlineDB.saveSetting('suppliers', data);
    }
  };

  const generateProductCode = async (): Promise<string> => {
    if (isOnline) {
      try {
        const { data, error } = await supabase.rpc('generate_product_code');
        if (error) throw error;
        return data;
      } catch (error) {
        console.warn('Failed to generate product code online, using fallback:', error);
      }
    }
    
    // Fallback generation
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `PRD${timestamp}${random}`;
  };

  const generateBarcode = async (): Promise<string> => {
    if (isOnline) {
      try {
        const { data, error } = await supabase.rpc('generate_barcode');
        if (error) throw error;
        return data;
      } catch (error) {
        console.warn('Failed to generate barcode online, using fallback:', error);
      }
    }
    
    // Fallback generation
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${timestamp}${random}1`; // Simple 13-digit barcode
  };

  const createProduct = async (productData: Partial<Product>) => {
    try {
      if (isOnline) {
        const { data, error } = await supabase
          .from('products')
          .insert([productData])
          .select(`
            *,
            category:categories!products_category_id_fkey(*),
            subcategory:categories!products_subcategory_id_fkey(*),
            supplier_info:suppliers!products_supplier_id_fkey(*)
          `)
          .single();

        if (error) throw error;
        
        await loadProducts();
        return data;
      } else {
        // Queue for sync when online
        await syncManager.queueAction({
          type: 'CREATE_PRODUCT',
          data: productData
        });
        
        // Add to local storage temporarily
        const tempProduct = {
          ...productData,
          id: `temp_${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Product;
        
        const updatedProducts = [...products, tempProduct];
        setProducts(updatedProducts);
        await offlineDB.saveProducts(updatedProducts);
        
        return tempProduct;
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create product');
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    try {
      if (isOnline) {
        const { data, error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', id)
          .select(`
            *,
            category:categories!products_category_id_fkey(*),
            subcategory:categories!products_subcategory_id_fkey(*),
            supplier_info:suppliers!products_supplier_id_fkey(*)
          `)
          .single();

        if (error) throw error;
        
        await loadProducts();
        return data;
      } else {
        // Queue for sync when online
        await syncManager.queueAction({
          type: 'UPDATE_PRODUCT',
          id,
          data: productData
        });
        
        // Update local storage
        const updatedProducts = products.map(p => 
          p.id === id ? { ...p, ...productData, updated_at: new Date().toISOString() } : p
        );
        setProducts(updatedProducts);
        await offlineDB.saveProducts(updatedProducts);
        
        return updatedProducts.find(p => p.id === id);
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update product');
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      if (isOnline) {
        const { error } = await supabase
          .from('products')
          .update({ is_active: false })
          .eq('id', id);

        if (error) throw error;
        
        await loadProducts();
      } else {
        // Queue for sync when online
        await syncManager.queueAction({
          type: 'DELETE_PRODUCT',
          id
        });
        
        // Remove from local storage
        const updatedProducts = products.filter(p => p.id !== id);
        setProducts(updatedProducts);
        await offlineDB.saveProducts(updatedProducts);
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete product');
    }
  };

  const filterProducts = (filters: InventoryFilters): Product[] => {
    return products.filter(product => {
      // Search filter
      const searchTerm = filters.search.toLowerCase();
      const name = (product.name || '').toLowerCase();
      const description = (product.description || '').toLowerCase();
      const productCode = product.product_code.toLowerCase();
      const barcode = (product.barcode || '').toLowerCase();
      
      if (filters.search && 
          !name.includes(searchTerm) && 
          !description.includes(searchTerm) &&
          !productCode.includes(searchTerm) && 
          !barcode.includes(searchTerm)) {
        return false;
      }
      
      if (filters.category_id && product.category_id !== filters.category_id) {
        return false;
      }
      
      if (filters.subcategory_id && product.subcategory_id !== filters.subcategory_id) {
        return false;
      }
      
      if (filters.supplier_id && product.supplier_id !== filters.supplier_id) {
        return false;
      }
      
      if (filters.low_stock_only && product.quantity_in_stock > product.min_stock_level) {
        return false;
      }
      
      return true;
    });
  };

  const searchProducts = async (query: string): Promise<Product[]> => {
    if (isOnline) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            category:categories!products_category_id_fkey(*),
            supplier_info:suppliers!products_supplier_id_fkey(*),
            variants:product_variants(*)
          `)
          .or(`name.ilike.%${query}%,product_code.ilike.%${query}%,barcode.ilike.%${query}%`)
          .eq('is_active', true)
          .limit(10);

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.warn('Online search failed, using offline search:', error);
      }
    }
    
    // Fallback to offline search
    return await syncManager.searchOfflineProducts(query);
  };

  const findProductByBarcode = async (barcode: string): Promise<{ product: Product; variant?: any } | null> => {
    if (isOnline) {
      try {
        // First try to find by product barcode
        const { data: products, error: productError } = await supabase
          .from('products')
          .select(`
            *,
            category:categories!products_category_id_fkey(*),
            supplier_info:suppliers!products_supplier_id_fkey(*),
            variants:product_variants(*)
          `)
          .eq('barcode', barcode)
          .eq('is_active', true)
          .single();

        if (!productError && products) {
          toast({
            title: "Product Found",
            description: `Found product: ${products.name}`,
          });
          return { product: products };
        }

        // Then try to find by variant barcode
        const { data: variants, error: variantError } = await supabase
          .from('product_variants')
          .select(`
            *,
            product:products!product_variants_product_id_fkey(
              *,
              category:categories!products_category_id_fkey(*),
              supplier_info:suppliers!products_supplier_id_fkey(*)
            )
          `)
          .eq('barcode', barcode)
          .single();

        if (!variantError && variants) {
          toast({
            title: "Product Variant Found",
            description: `Found variant: ${variants.product.name} - ${variants.name}: ${variants.value}`,
          });
          return { 
            product: variants.product, 
            variant: variants 
          };
        }
      } catch (error) {
        console.warn('Online barcode search failed, trying offline:', error);
      }
    }

    // Fallback to offline search
    try {
      const product = await syncManager.findOfflineProductByBarcode(barcode);
      if (product) {
        // Check if barcode matches a variant
        const variant = product.variants?.find(v => v.barcode === barcode);
        if (variant) {
          toast({
            title: "Product Variant Found (Offline)",
            description: `Found variant: ${product.name} - ${variant.name}: ${variant.value}`,
          });
        } else {
          toast({
            title: "Product Found (Offline)",
            description: `Found product: ${product.name}`,
          });
        }
        return { product, variant };
      }
    } catch (error) {
      console.error('Offline barcode search failed:', error);
    }

    toast({
      title: "Product Not Found",
      description: "No product found with this barcode",
      variant: "destructive",
    });
    return null;
  };

  return {
    products,
    categories,
    suppliers,
    loading,
    error,
    isOnline,
    createProduct,
    updateProduct,
    deleteProduct,
    filterProducts,
    searchProducts,
    findProductByBarcode,
    generateProductCode,
    generateBarcode,
    refreshData: loadData
  };
}