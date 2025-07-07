import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Product, Category } from '../types/inventory';
import { Transaction } from '../types/pos';
import { Customer, CustomerServiceTicket } from '../types/customer';
import { ServiceTicket } from '../types/tickets';

interface InventoryDB extends DBSchema {
  products: {
    key: string;
    value: Product;
    indexes: { 'by-barcode': string; 'by-code': string; 'by-category': string };
  };
  categories: {
    key: string;
    value: Category;
  };
  transactions: {
    key: string;
    value: Transaction;
    indexes: { 'by-date': string; 'by-status': string };
  };
  customers: {
    key: string;
    value: Customer;
    indexes: { 'by-email': string; 'by-phone': string; 'by-type': string };
  };
  service_tickets: {
    key: string;
    value: ServiceTicket;
    indexes: { 'by-customer': string; 'by-status': string; 'by-date': string };
  };
  sync_queue: {
    key: string;
    value: {
      id: string;
      type: string;
      data: Record<string, unknown>;
      timestamp: string;
      retries: number;
    };
    indexes: { 'by-timestamp': string };
  };
  settings: {
    key: string;
    value: Record<string, unknown>;
  };
}

class OfflineDatabase {
  private db: IDBPDatabase<InventoryDB> | null = null;
  private readonly DB_NAME = 'InventoryDB';
  private readonly DB_VERSION = 2; // Increment version for new schema

  async init(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<InventoryDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db, oldVersion) {
        // Products store
        if (oldVersion < 1) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('by-barcode', 'barcode');
          productStore.createIndex('by-code', 'product_code');
          productStore.createIndex('by-category', 'category_id');

          // Categories store
          db.createObjectStore('categories', { keyPath: 'id' });

          // Transactions store
          const transactionStore = db.createObjectStore('transactions', { keyPath: 'id' });
          transactionStore.createIndex('by-date', 'created_at');
          transactionStore.createIndex('by-status', 'status');

          // Sync queue store
          const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
          syncStore.createIndex('by-timestamp', 'timestamp');

          // Settings store
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        // Add customers and service_tickets stores in version 2
        if (oldVersion < 2) {
          // Customers store
          const customerStore = db.createObjectStore('customers', { keyPath: 'id' });
          customerStore.createIndex('by-email', 'email');
          customerStore.createIndex('by-phone', 'phone');
          customerStore.createIndex('by-type', 'customer_type');

          // Service tickets store
          const ticketStore = db.createObjectStore('service_tickets', { keyPath: 'id' });
          ticketStore.createIndex('by-customer', 'customer_id');
          ticketStore.createIndex('by-status', 'status');
          ticketStore.createIndex('by-date', 'created_at');
        }
      },
    });
  }

  // Products
  async saveProducts(products: Product[]): Promise<void> {
    await this.init();
    const tx = this.db!.transaction('products', 'readwrite');
    await Promise.all(products.map(product => tx.store.put(product)));
    await tx.done;
  }

  async getProducts(): Promise<Product[]> {
    await this.init();
    return await this.db!.getAll('products');
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    await this.init();
    return await this.db!.getFromIndex('products', 'by-barcode', barcode);
  }

  async getProductByCode(code: string): Promise<Product | undefined> {
    await this.init();
    return await this.db!.getFromIndex('products', 'by-code', code);
  }

  async searchProducts(query: string): Promise<Product[]> {
    await this.init();
    const products = await this.db!.getAll('products');
    const lowerQuery = query.toLowerCase();
    
    return products.filter(product => 
      product.name.toLowerCase().includes(lowerQuery) ||
      product.product_code.toLowerCase().includes(lowerQuery) ||
      (product.barcode && product.barcode.toLowerCase().includes(lowerQuery))
    );
  }

  // Categories
  async saveCategories(categories: Category[]): Promise<void> {
    await this.init();
    const tx = this.db!.transaction('categories', 'readwrite');
    await Promise.all(categories.map(category => tx.store.put(category)));
    await tx.done;
  }

  async getCategories(): Promise<Category[]> {
    await this.init();
    return await this.db!.getAll('categories');
  }

  // Transactions
  async saveTransaction(transaction: Transaction): Promise<void> {
    await this.init();
    await this.db!.put('transactions', transaction);
  }

  async getTransactions(): Promise<Transaction[]> {
    await this.init();
    return await this.db!.getAll('transactions');
  }

  async getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    await this.init();
    const transactions = await this.db!.getAll('transactions');
    return transactions.filter(tx => 
      tx.created_at >= startDate && tx.created_at <= endDate
    );
  }

  // Customers
  async saveCustomer(customer: Customer): Promise<void> {
    await this.init();
    await this.db!.put('customers', customer);
  }

  async saveCustomers(customers: Customer[]): Promise<void> {
    await this.init();
    const tx = this.db!.transaction('customers', 'readwrite');
    await Promise.all(customers.map(customer => tx.store.put(customer)));
    await tx.done;
  }

  async getCustomers(): Promise<Customer[]> {
    await this.init();
    return await this.db!.getAll('customers');
  }

  async getCustomerById(id: string): Promise<Customer | undefined> {
    await this.init();
    return await this.db!.get('customers', id);
  }

  async deleteCustomer(id: string): Promise<void> {
    await this.init();
    await this.db!.delete('customers', id);
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    await this.init();
    const customers = await this.db!.getAll('customers');
    const lowerQuery = query.toLowerCase();
    
    return customers.filter(customer => 
      customer.full_name.toLowerCase().includes(lowerQuery) ||
      customer.email.toLowerCase().includes(lowerQuery) ||
      customer.phone.includes(lowerQuery)
    );
  }

  // Service Tickets
  async saveServiceTicket(ticket: ServiceTicket): Promise<void> {
    await this.init();
    await this.db!.put('service_tickets', ticket);
  }

  async saveServiceTickets(tickets: ServiceTicket[]): Promise<void> {
    await this.init();
    const tx = this.db!.transaction('service_tickets', 'readwrite');
    await Promise.all(tickets.map(ticket => tx.store.put(ticket)));
    await tx.done;
  }

  async getCustomerTickets(customerId: string): Promise<CustomerServiceTicket[]> {
    await this.init();
    const tickets = await this.db!.getAllFromIndex('service_tickets', 'by-customer', customerId);
    return tickets.map(ticket => ({
      id: ticket.id,
      ticket_number: ticket.ticket_number,
      type: ticket.type,
      status: ticket.status,
      priority: ticket.priority,
      price_quote: ticket.price_quote,
      final_price: ticket.final_price,
      paid: ticket.paid,
      created_at: ticket.created_at,
      updated_at: ticket.updated_at,
    }));
  }

  // Sync Queue
  async addToSyncQueue(action: {
    type: string;
    data: Record<string, unknown>;
    id?: string;
  }): Promise<void> {
    await this.init();
    const queueItem = {
      id: action.id || `${action.type}_${Date.now()}_${Math.random()}`,
      type: action.type,
      data: action.data,
      timestamp: new Date().toISOString(),
      retries: 0
    };
    await this.db!.put('sync_queue', queueItem);
  }

  async getSyncQueue(): Promise<Record<string, unknown>[]> {
    await this.init();
    return await this.db!.getAll('sync_queue');
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    await this.init();
    await this.db!.delete('sync_queue', id);
  }

  async incrementSyncRetries(id: string): Promise<void> {
    await this.init();
    const item = await this.db!.get('sync_queue', id);
    if (item) {
      item.retries += 1;
      await this.db!.put('sync_queue', item);
    }
  }

  // Settings
  async saveSetting(key: string, value: Record<string, unknown>): Promise<void> {
    await this.init();
    await this.db!.put('settings', { key, value });
  }

  async getSetting(key: string): Promise<Record<string, unknown> | undefined> {
    await this.init();
    const setting = await this.db!.get('settings', key);
    return setting?.value as Record<string, unknown> | undefined;
  }

  // Utility
  async clear(): Promise<void> {
    await this.init();
    const stores = ['products', 'categories', 'transactions', 'customers', 'service_tickets', 'sync_queue', 'settings'] as const;
    const tx = this.db!.transaction(stores, 'readwrite');
    await Promise.all(stores.map(store => tx.objectStore(store).clear()));
    await tx.done;
  }

  async getStorageInfo(): Promise<{
    products: number;
    categories: number;
    transactions: number;
    customers: number;
    serviceTickets: number;
    syncQueue: number;
  }> {
    await this.init();
    const [products, categories, transactions, customers, serviceTickets, syncQueue] = await Promise.all([
      this.db!.count('products'),
      this.db!.count('categories'),
      this.db!.count('transactions'),
      this.db!.count('customers'),
      this.db!.count('service_tickets'),
      this.db!.count('sync_queue')
    ]);

    return { products, categories, transactions, customers, serviceTickets, syncQueue };
  }
}

const offlineDB = new OfflineDatabase();
export default offlineDB;
export { offlineDB };