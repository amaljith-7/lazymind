'use client';

import { useStore, selectSyncStatus } from '@/lib/store';

export function TopBar() {
  const syncStatus = useStore(selectSyncStatus);
  const triggerSync = useStore(state => state.triggerSync);

  // Determine sync indicator color
  const getSyncColor = () => {
    if (syncStatus.syncError) return 'bg-red-500';
    if (syncStatus.isSyncing) return 'bg-yellow-500 animate-pulse';
    if (syncStatus.pendingChanges > 0) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Format last sync time
  const getLastSyncText = () => {
    if (!syncStatus.lastSyncTime) return 'Never synced';

    const now = Date.now();
    const diff = now - syncStatus.lastSyncTime;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(syncStatus.lastSyncTime).toLocaleDateString();
  };

  return (
    <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-6 py-3">
      {/* Left side: App title */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Notes
        </h1>
      </div>

      {/* Right side: Sync status */}
      <div className="flex items-center gap-4">
        {/* Sync indicator */}
        <button
          onClick={triggerSync}
          disabled={syncStatus.isSyncing}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
          title={syncStatus.syncError || 'Click to sync'}
        >
          {/* Status dot */}
          <span className={`w-2 h-2 rounded-full ${getSyncColor()}`} />

          {/* Status text */}
          <span>
            {syncStatus.isSyncing ? (
              'Syncing...'
            ) : syncStatus.syncError ? (
              'Sync error'
            ) : syncStatus.pendingChanges > 0 ? (
              `${syncStatus.pendingChanges} pending`
            ) : (
              getLastSyncText()
            )}
          </span>
        </button>

        {/* Keyboard hint */}
        <div className="text-xs text-gray-500 dark:text-gray-500 hidden md:block">
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded text-xs">
            ⌘K
          </kbd>
          <span className="ml-1">for commands</span>
        </div>
      </div>
    </div>
  );
}
