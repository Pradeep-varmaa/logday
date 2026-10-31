import { offlineDb } from './db';
import { useAppStore } from '@/store/useAppStore';

let isFlushing = false;

/**
 * Saves log locally to IndexedDB immediately and queues for server sync.
 */
export async function queueLogUpsert(
  activityId: string,
  logDate: string,
  value: number,
  note?: string | null,
  link?: string | null
): Promise<void> {
  const store = useAppStore.getState();

  // 1. Write immediately to local Dexie cache
  try {
    await offlineDb.logs.put({
      activity_id: activityId,
      log_date: logDate,
      value,
      is_completed: false, // will be confirmed by calculation
      note,
      link,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Failed writing to local IndexedDB:', err);
  }

  // 2. Add to outbox queue
  await offlineDb.outbox.add({
    action: 'UPSERT_LOG',
    payload: {
      activity_id: activityId,
      log_date: logDate,
      value,
      note,
      link,
    },
    timestamp: Date.now(),
    retryCount: 0,
  });

  // 3. Update sync state & attempt sync if online
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    store.setSyncStatus('offline');
  } else {
    store.setSyncStatus('syncing');
    flushOutbox().catch(console.error);
  }
}

/**
 * Flushes all pending outbox queue items to the server.
 */
export async function flushOutbox(): Promise<void> {
  if (isFlushing) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    useAppStore.getState().setSyncStatus('offline');
    return;
  }

  const items = await offlineDb.outbox.toArray();
  if (items.length === 0) {
    useAppStore.getState().setSyncStatus('synced');
    return;
  }

  isFlushing = true;
  useAppStore.getState().setSyncStatus('syncing');

  try {
    for (const item of items) {
      if (item.action === 'UPSERT_LOG') {
        const res = await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.payload),
        });

        if (res.ok) {
          if (item.id !== undefined) {
            await offlineDb.outbox.delete(item.id);
          }
        } else if (res.status === 401) {
          // Auth required - pause flush
          console.warn('Sync paused: user session required');
          break;
        } else {
          // Increment retry count
          if (item.id !== undefined) {
            await offlineDb.outbox.update(item.id, { retryCount: item.retryCount + 1 });
          }
        }
      }
    }

    const remaining = await offlineDb.outbox.count();
    useAppStore.getState().setSyncStatus(remaining === 0 ? 'synced' : 'offline');
  } catch (err) {
    console.error('Error during outbox flush:', err);
    useAppStore.getState().setSyncStatus('offline');
  } finally {
    isFlushing = false;
  }
}

/**
 * Initialize online/offline browser event listeners.
 */
export function initSyncListeners(): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => {
    useAppStore.getState().setSyncStatus('syncing');
    flushOutbox().catch(console.error);
  };

  const handleOffline = () => {
    useAppStore.getState().setSyncStatus('offline');
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Initial check
  if (!navigator.onLine) {
    useAppStore.getState().setSyncStatus('offline');
  } else {
    flushOutbox().catch(console.error);
  }

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
