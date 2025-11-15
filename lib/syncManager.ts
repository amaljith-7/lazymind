// Sync queue manager (stub for Phase 5 implementation)
import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
import type { Note, SyncQueueItem, SyncStatus } from '@/types';

// ============================================================================
// SYNC QUEUE OPERATIONS
// ============================================================================

/**
 * Add a note operation to the sync queue
 */
export async function addNoteToSyncQueue(
  note: Note,
  operationType: 'create' | 'update' | 'delete'
): Promise<SyncQueueItem> {
  const queueItem: SyncQueueItem = {
    id: uuidv4(),
    operationType,
    noteId: note.uuid,
    payload: note,
    createdAt: Date.now(),
    attemptCount: 0,
    lastAttemptAt: null,
    status: 'pending',
    errorMessage: null
  };

  await db.syncQueue.add(queueItem);
  return queueItem;
}

/**
 * Get all pending sync queue items
 */
export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  return db.syncQueue
    .where('status')
    .equals('pending')
    .sortBy('createdAt');
}

/**
 * Get count of pending sync items
 */
export async function getPendingSyncCount(): Promise<number> {
  return db.syncQueue
    .where('status')
    .equals('pending')
    .count();
}

/**
 * Update a sync queue item
 */
export async function updateSyncQueueItem(
  id: string,
  updates: Partial<SyncQueueItem>
): Promise<boolean> {
  const item = await db.syncQueue.get(id);

  if (!item) {
    return false;
  }

  await db.syncQueue.update(id, updates);
  return true;
}

/**
 * Mark sync queue item as completed
 */
export async function markSyncItemCompleted(id: string): Promise<boolean> {
  return updateSyncQueueItem(id, {
    status: 'completed',
    lastAttemptAt: Date.now()
  });
}

/**
 * Mark sync queue item as failed
 */
export async function markSyncItemFailed(
  id: string,
  errorMessage: string
): Promise<boolean> {
  const item = await db.syncQueue.get(id);

  if (!item) {
    return false;
  }

  return updateSyncQueueItem(id, {
    status: 'failed',
    errorMessage,
    attemptCount: item.attemptCount + 1,
    lastAttemptAt: Date.now()
  });
}

/**
 * Clear completed sync items from queue
 */
export async function clearCompletedSyncItems(): Promise<number> {
  const completed = await db.syncQueue
    .where('status')
    .equals('completed')
    .toArray();

  await db.syncQueue.bulkDelete(completed.map(item => item.id));
  return completed.length;
}

/**
 * Update note sync status
 */
export async function updateNoteSyncStatus(
  noteId: string,
  status: 'pending' | 'synced' | 'error'
): Promise<boolean> {
  const note = await db.notes.where('uuid').equals(noteId).first();

  if (!note) {
    return false;
  }

  if (note.id === undefined) {
    return false;
  }

  await db.notes.update(note.id, {
    syncStatus: status
  });

  return true;
}

// ============================================================================
// SYNC ENGINE (STUB - Will be implemented in Phase 5)
// ============================================================================

/**
 * Process the sync queue (stub implementation)
 * In Phase 5, this will make actual API calls to backend
 */
export async function processSyncQueue(): Promise<void> {
  console.log('[Sync] Processing sync queue (stub mode - no backend yet)');

  const pendingItems = await getSyncQueue();

  if (pendingItems.length === 0) {
    console.log('[Sync] No pending items to sync');
    return;
  }

  console.log(`[Sync] Found ${pendingItems.length} pending items`);

  // STUB: Just mark everything as synced immediately
  for (const item of pendingItems) {
    await markSyncItemCompleted(item.id);
    await updateNoteSyncStatus(item.noteId, 'synced');
  }

  console.log('[Sync] All items marked as synced (stub mode)');
}

/**
 * Get last sync time
 */
export async function getLastSyncTime(): Promise<number | null> {
  const completedItems = await db.syncQueue
    .where('status')
    .equals('completed')
    .reverse()
    .sortBy('lastAttemptAt');

  if (completedItems.length === 0) {
    return null;
  }

  return completedItems[0].lastAttemptAt;
}

/**
 * Get current sync status
 */
export async function getSyncStatus(): Promise<SyncStatus> {
  const pendingCount = await getPendingSyncCount();
  const lastSyncTime = await getLastSyncTime();

  // Check if any notes have sync errors
  const errorNotes = await db.notes
    .where('syncStatus')
    .equals('error')
    .toArray();

  return {
    isSyncing: false, // Will be managed by state in Phase 5
    pendingChanges: pendingCount,
    lastSyncTime,
    syncError: errorNotes.length > 0 ? `${errorNotes.length} notes failed to sync` : null
  };
}

/**
 * Retry failed sync items
 */
export async function retryFailedSyncs(): Promise<number> {
  const failedItems = await db.syncQueue
    .where('status')
    .equals('failed')
    .toArray();

  for (const item of failedItems) {
    await updateSyncQueueItem(item.id, {
      status: 'pending',
      errorMessage: null
    });
  }

  // Trigger sync process
  await processSyncQueue();

  return failedItems.length;
}

/**
 * Clear all sync queue items (useful for testing)
 */
export async function clearSyncQueue(): Promise<void> {
  await db.syncQueue.clear();
  console.log('[Sync] Queue cleared');
}

// ============================================================================
// AUTO-SYNC HELPERS (For Phase 2 UI integration)
// ============================================================================

/**
 * Initialize auto-sync listener
 * This will be called when the app loads to set up periodic syncing
 */
export function initializeAutoSync(intervalMs: number = 30000): () => void {
  console.log(`[Sync] Initializing auto-sync with ${intervalMs}ms interval`);

  const intervalId = setInterval(async () => {
    const pendingCount = await getPendingSyncCount();

    if (pendingCount > 0) {
      console.log(`[Sync] Auto-sync triggered (${pendingCount} pending items)`);
      await processSyncQueue();
    }
  }, intervalMs);

  // Return cleanup function
  return () => {
    clearInterval(intervalId);
    console.log('[Sync] Auto-sync stopped');
  };
}

/**
 * Setup online/offline event listeners
 */
export function setupOnlineListener(): () => void {
  const handleOnline = async () => {
    console.log('[Sync] Connection restored, processing queue');
    await processSyncQueue();
  };

  const handleOffline = () => {
    console.log('[Sync] Connection lost');
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  return () => {}; // No-op cleanup for server-side
}
