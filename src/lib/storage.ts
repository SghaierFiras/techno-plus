// Offline-first storage utilities
export class OfflineStorage {
  private static readonly STORAGE_PREFIX = 'inventory_';
  
  static set(key: string, value: any): void {
    try {
      localStorage.setItem(
        `${this.STORAGE_PREFIX}${key}`, 
        JSON.stringify(value)
      );
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }
  
  static get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(`${this.STORAGE_PREFIX}${key}`);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }
  
  static remove(key: string): void {
    try {
      localStorage.removeItem(`${this.STORAGE_PREFIX}${key}`);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }
  
  static clear(): void {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.STORAGE_PREFIX))
        .forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
  
  static isOnline(): boolean {
    return navigator.onLine;
  }
  
  // Queue actions for when back online
  static queueAction(action: any): void {
    const queue = this.get<any[]>('sync_queue') || [];
    queue.push({
      ...action,
      timestamp: new Date().toISOString()
    });
    this.set('sync_queue', queue);
  }
  
  static getQueue(): any[] {
    return this.get<any[]>('sync_queue') || [];
  }
  
  static clearQueue(): void {
    this.remove('sync_queue');
  }
}