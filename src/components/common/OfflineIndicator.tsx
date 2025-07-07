import React, { useState } from 'react';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  X,
  Info
} from 'lucide-react';
import QueueLogViewer from './QueueLogViewer';

export default function OfflineIndicator() {
  const { syncStatus, forceSync, clearSyncErrors } = useOfflineSync();
  const [showDetails, setShowDetails] = useState(false);
  const [showQueueLog, setShowQueueLog] = useState(false);

  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = () => {
    if (!syncStatus.isOnline) return 'bg-red-500';
    if (syncStatus.isSyncing) return 'bg-yellow-500';
    if (syncStatus.pendingActions > 0) return 'bg-orange-500';
    if (syncStatus.syncErrors.length > 0) return 'bg-red-500';
    return 'bg-green-500';
  };

  const getStatusIcon = () => {
    if (!syncStatus.isOnline) return <WifiOff className="h-4 w-4" />;
    if (syncStatus.isSyncing) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (syncStatus.pendingActions > 0) return <Clock className="h-4 w-4" />;
    if (syncStatus.syncErrors.length > 0) return <AlertTriangle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (!syncStatus.isOnline) return 'Offline';
    if (syncStatus.isSyncing) return 'Syncing...';
    if (syncStatus.pendingActions > 0) return `${syncStatus.pendingActions} pending`;
    if (syncStatus.syncErrors.length > 0) return 'Sync errors';
    return 'Online';
  };

  return (
    <div className="relative">
      {/* Status Indicator */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white transition-colors duration-200 ${getStatusColor()} hover:opacity-80`}
      >
        {getStatusIcon()}
        <span className="ml-1">{getStatusText()}</span>
      </button>

      {/* Detailed Status Panel */}
      {showDetails && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900">Sync Status</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Connection Status */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Connection:</span>
                <div className="flex items-center">
                  {syncStatus.isOnline ? (
                    <Wifi className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${
                    syncStatus.isOnline ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {syncStatus.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>

              {/* Last Sync */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last sync:</span>
                <span className="text-sm text-gray-900">
                  {formatLastSync(syncStatus.lastSyncTime)}
                </span>
              </div>

              {/* Pending Actions */}
              {syncStatus.pendingActions > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pending actions:</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    <Clock className="h-3 w-3 mr-1" />
                    {syncStatus.pendingActions}
                  </span>
                </div>
              )}

              {/* Sync Errors */}
              {syncStatus.syncErrors.length > 0 && (
                <div className="mt-3 p-3 bg-red-50 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-red-800">Sync Errors:</span>
                    <button
                      onClick={clearSyncErrors}
                      className="text-xs text-red-600 hover:text-red-800 underline"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="space-y-1">
                    {syncStatus.syncErrors.slice(0, 3).map((error, index) => (
                      <p key={index} className="text-xs text-red-700">
                        {error}
                      </p>
                    ))}
                    {syncStatus.syncErrors.length > 3 && (
                      <p className="text-xs text-red-600">
                        +{syncStatus.syncErrors.length - 3} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Offline Mode Info */}
              {!syncStatus.isOnline && (
                <div className="mt-3 p-3 bg-blue-50 rounded-md">
                  <div className="flex items-start">
                    <Info className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-xs text-blue-700">
                      <p className="font-medium mb-1">Offline Mode Active</p>
                      <p>Your data is being saved locally and will sync automatically when you're back online.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Manual Sync Button */}
              {syncStatus.isOnline && (
                <button
                  onClick={forceSync}
                  disabled={syncStatus.isSyncing}
                  className="w-full mt-3 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
                  {syncStatus.isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
              )}

              {/* Queue/Log Viewer Button */}
              <button
                onClick={() => setShowQueueLog(true)}
                className="w-full mt-2 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Info className="h-4 w-4 mr-2" />
                View Sync Queue & Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Queue/Log Viewer Modal */}
      <QueueLogViewer open={showQueueLog} onOpenChange={setShowQueueLog} />
    </div>
  );
}