import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table';
import { Button } from '../ui/button';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { AlertTriangle } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

// Define the sync queue item type
export interface SyncQueueItem {
  id: string;
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
  retries: number;
}

interface QueueLogViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function hasMergeWarning(data: Record<string, unknown>): data is { mergeWarning: string } {
  return typeof data.mergeWarning === 'string';
}

function hasConflict(data: Record<string, unknown>): data is { conflict: string } {
  return typeof data.conflict === 'string';
}

export default function QueueLogViewer({ open, onOpenChange }: QueueLogViewerProps) {
  const { getSyncQueue, forceSync } = useOfflineSync();
  const { toast } = useToast();
  const [queue, setQueue] = useState<SyncQueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      setError(null);
      getSyncQueue()
        .then((q: unknown) => setQueue(q as SyncQueueItem[]))
        .catch((err) => {
          setError(err instanceof Error ? err.message : String(err));
          setQueue([]);
        })
        .finally(() => setLoading(false));
    }
  }, [open, getSyncQueue]);

  const handleRetryAll = async () => {
    setRetrying(true);
    setError(null);
    try {
      await forceSync();
      setLoading(true);
      getSyncQueue()
        .then((q: unknown) => setQueue(q as SyncQueueItem[]))
        .catch((err) => {
          setError(err instanceof Error ? err.message : String(err));
          setQueue([]);
        })
        .finally(() => setLoading(false));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRetrying(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    setError(null);
    try {
      // Dynamically import offlineDB to avoid circular deps
      const offlineDB = (await import('../../lib/offlineDB')).default;
      await offlineDB.clear();
      toast({ title: 'Offline data cleared', description: 'All offline data and sync queue have been reset.' });
      setQueue([]);
    } catch (err) {
      setError('Failed to clear offline data: ' + (err instanceof Error ? err.message : String(err)));
      toast({ title: 'Error', description: 'Failed to clear offline data', variant: 'destructive' });
    } finally {
      setResetting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Offline Sync Queue & Log</DialogTitle>
          <DialogDescription>
            These are the actions waiting to sync with the server. If you see repeated failures, check your connection or data.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-between items-center mb-4 gap-2">
          <Button variant="outline" onClick={handleRetryAll} disabled={retrying || loading || resetting}>
            {retrying ? 'Retrying...' : 'Retry All'}
          </Button>
          <Button variant="destructive" onClick={handleReset} disabled={resetting || loading || retrying}>
            {resetting ? 'Resetting...' : 'Reset Offline Data'}
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
        {error && (
          <div className="text-center py-2 text-red-600 text-sm">{error}</div>
        )}
        {loading ? (
          <div className="text-center py-8">Loading queue...</div>
        ) : queue.length === 0 && !error ? (
          <div className="text-center py-8 text-muted-foreground">No pending offline actions.</div>
        ) : !error && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Retries</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="max-w-[120px] truncate" title={item.id}>{item.id}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>{new Date(item.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{item.retries}</TableCell>
                  <TableCell className="max-w-xs overflow-x-auto text-xs">
                    {item.data && hasMergeWarning(item.data) && (
                      <div className="flex items-center text-yellow-700 mb-1">
                        <AlertTriangle className="h-4 w-4 mr-1 text-yellow-600" />
                        <span>{item.data.mergeWarning}</span>
                      </div>
                    )}
                    {item.data && hasConflict(item.data) && (
                      <div className="flex items-center text-red-700 mb-1">
                        <AlertTriangle className="h-4 w-4 mr-1 text-red-600" />
                        <span>{item.data.conflict}</span>
                      </div>
                    )}
                    <pre className="whitespace-pre-wrap break-all">{JSON.stringify(item.data, null, 2)}</pre>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
} 