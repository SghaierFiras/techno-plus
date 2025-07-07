import { useState, useEffect } from 'react';
import { syncManager, SyncStatus } from '../lib/syncManager';

export function useOfflineSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSyncTime: null,
    pendingActions: 0,
    syncErrors: []
  });

  useEffect(() => {
    // Initial status
    syncManager.getSyncStatus().then(setSyncStatus);

    // Subscribe to sync status changes
    const unsubscribeSync = syncManager.onSyncStatusChange(setSyncStatus);

    return unsubscribeSync;
  }, []);

  const forceSync = async () => {
    await syncManager.forcSync();
  };

  const clearSyncErrors = async () => {
    // Clear errors from storage
    await syncManager.queueAction({
      type: 'CLEAR_SYNC_ERRORS',
      data: {}
    });
  };

  return {
    syncStatus,
    forceSync,
    clearSyncErrors,
    getSyncQueue: async () => await (await import('../lib/offlineDB')).offlineDB.getSyncQueue()
  };
}