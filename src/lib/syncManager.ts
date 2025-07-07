import { supabase } from './supabase';
import { offlineDB } from './offlineDB';
import { Product, Category } from '../types/inventory';
import { Transaction } from '../types/pos';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  pendingActions: number;
  syncErrors: string[];
}

class SyncManager {
  private syncInProgress = false;
  private syncListeners: ((status: SyncStatus) => void)[] = [];
  private onlineStatusListeners: ((isOnline: boolean) => void)[] = [];
  private isOnline = navigator.onLine;

  constructor() {
    this.setupEventListeners();
    this.startPeriodicSync();
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyOnlineStatusListeners(true);
      this.syncWhenOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyOnlineStatusListeners(false);
    });

    // Sync when page becomes visible (user returns to tab)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.syncWhenOnline();
      }
    });
  }

  private startPeriodicSync(): void {
    // Sync every 5 minutes when online
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncWhenOnline();
      }
    }, 5 * 60 * 1000);
  }

  async syncWhenOnline(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return;

    this.syncInProgress = true;
    this.notifySyncListeners();

    try {
      await this.downloadData();
      await this.uploadPendingActions();
      await offlineDB.saveSetting('lastSyncTime', new Date().toISOString());
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
      this.notifySyncListeners();
    }
  }

  private async downloadData(): Promise<void> {
    try {
      // Download products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          category:categories!products_category_id_fkey(*),
          subcategory:categories!products_subcategory_id_fkey(*),
          variants:product_variants(*)
        `)
        .eq('is_active', true);

      if (productsError) throw productsError;
      if (products) await offlineDB.saveProducts(products);

      // Download categories
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true);

      if (categoriesError) throw categoriesError;
      if (categories) {
        // Organize categories with subcategories
        const categoriesMap = new Map<string, Category>();
        const rootCategories: Category[] = [];

        categories.forEach(cat => {
          categoriesMap.set(cat.id, { ...cat, children: [] });
        });

        categories.forEach(cat => {
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

        await offlineDB.saveCategories(rootCategories);
      }
    } catch (error) {
      console.error('Error downloading data:', error);
      throw error;
    }
  }

  private async uploadPendingActions(): Promise<void> {
    const syncQueue = await offlineDB.getSyncQueue();
    const errors: string[] = [];

    for (const item of syncQueue) {
      try {
        await this.processSyncItem(item);
        await offlineDB.removeSyncQueueItem(item.id);
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error);
        errors.push(`${item.type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Increment retry count
        await offlineDB.incrementSyncRetries(item.id);
        
        // Remove items that have failed too many times
        if (item.retries >= 3) {
          await offlineDB.removeSyncQueueItem(item.id);
          errors.push(`${item.type}: Removed after 3 failed attempts`);
        }
      }
    }

    if (errors.length > 0) {
      await offlineDB.saveSetting('syncErrors', errors);
    }
  }

  private async processSyncItem(item: any): Promise<void> {
    switch (item.type) {
      case 'CREATE_PRODUCT':
        await this.syncCreateProduct(item.data);
        break;
      case 'UPDATE_PRODUCT':
        await this.syncUpdateProduct(item.id, item.data);
        break;
      case 'DELETE_PRODUCT':
        await this.syncDeleteProduct(item.id);
        break;
      case 'CREATE_TRANSACTION':
        await this.syncCreateTransaction(item.data);
        break;
      case 'UPDATE_STOCK':
        await this.syncUpdateStock(item.data);
        break;
      default:
        console.warn(`Unknown sync item type: ${item.type}`);
    }
  }

  private async syncCreateProduct(productData: any): Promise<void> {
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (error) throw error;
    
    // Update local database with server-generated ID
    if (data) {
      await offlineDB.saveProducts([data]);
    }
  }

  private async syncUpdateProduct(id: string, productData: any): Promise<void> {
    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    if (data) {
      await offlineDB.saveProducts([data]);
    }
  }

  private async syncDeleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  }

  private async syncCreateTransaction(transactionData: Transaction): Promise<void> {
    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        transaction_number: transactionData.transaction_number,
        items: transactionData.items,
        subtotal: transactionData.subtotal,
        discount_amount: transactionData.discount_amount,
        tax_amount: transactionData.tax_amount,
        total: transactionData.total,
        payment_method: transactionData.payment_method,
        customer_id: transactionData.customer_id,
        status: transactionData.status
      }])
      .select()
      .single();

    if (error) throw error;

    // Update product stock
    if (transactionData.items) {
      await this.updateProductStock(transactionData.items);
    }

    // Update local transaction with server ID
    if (data) {
      const updatedTransaction = { ...transactionData, id: data.id };
      await offlineDB.saveTransaction(updatedTransaction);
    }
  }

  private async syncUpdateStock(stockData: any): Promise<void> {
    const { productId, variantId, quantity } = stockData;
    
    if (variantId) {
      const { error } = await supabase
        .from('product_variants')
        .update({
          quantity_in_stock: supabase.raw(`quantity_in_stock - ${quantity}`)
        })
        .eq('id', variantId);
      
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('products')
        .update({
          quantity_in_stock: supabase.raw(`quantity_in_stock - ${quantity}`)
        })
        .eq('id', productId);
      
      if (error) throw error;
    }
  }

  private async updateProductStock(items: any[]): Promise<void> {
    for (const item of items) {
      if (item.variant_id) {
        await supabase
          .from('product_variants')
          .update({
            quantity_in_stock: supabase.raw(`quantity_in_stock - ${item.quantity}`)
          })
          .eq('id', item.variant_id);
      } else {
        await supabase
          .from('products')
          .update({
            quantity_in_stock: supabase.raw(`quantity_in_stock - ${item.quantity}`)
          })
          .eq('id', item.product_id);
      }
    }
  }

  // Queue actions for offline sync
  async queueAction(action: {
    type: string;
    data: any;
    id?: string;
  }): Promise<void> {
    await offlineDB.addToSyncQueue(action);
    this.notifySyncListeners();
  }

  // Status methods
  async getSyncStatus(): Promise<SyncStatus> {
    const pendingActions = (await offlineDB.getSyncQueue()).length;
    const lastSyncTime = await offlineDB.getSetting('lastSyncTime');
    const syncErrors = await offlineDB.getSetting('syncErrors') || [];

    return {
      isOnline: this.isOnline,
      isSyncing: this.syncInProgress,
      lastSyncTime,
      pendingActions,
      syncErrors
    };
  }

  // Event listeners
  onSyncStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.syncListeners.push(callback);
    return () => {
      const index = this.syncListeners.indexOf(callback);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  onOnlineStatusChange(callback: (isOnline: boolean) => void): () => void {
    this.onlineStatusListeners.push(callback);
    return () => {
      const index = this.onlineStatusListeners.indexOf(callback);
      if (index > -1) {
        this.onlineStatusListeners.splice(index, 1);
      }
    };
  }

  private async notifySyncListeners(): Promise<void> {
    const status = await this.getSyncStatus();
    this.syncListeners.forEach(callback => callback(status));
  }

  private notifyOnlineStatusListeners(isOnline: boolean): void {
    this.onlineStatusListeners.forEach(callback => callback(isOnline));
  }

  // Manual sync trigger
  async forcSync(): Promise<void> {
    if (this.isOnline) {
      await this.syncWhenOnline();
    }
  }

  // Get offline data
  async getOfflineProducts(): Promise<Product[]> {
    return await offlineDB.getProducts();
  }

  async getOfflineCategories(): Promise<Category[]> {
    return await offlineDB.getCategories();
  }

  async searchOfflineProducts(query: string): Promise<Product[]> {
    return await offlineDB.searchProducts(query);
  }

  async findOfflineProductByBarcode(barcode: string): Promise<Product | undefined> {
    return await offlineDB.getProductByBarcode(barcode);
  }
}

export const syncManager = new SyncManager();