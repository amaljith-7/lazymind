// IndexedDB setup using Dexie.js
import Dexie, { type EntityTable } from 'dexie';
import type { Note, Folder, Label, ImageAttachment, SyncQueueItem } from '@/types';

// Extend Dexie with our typed tables
class LazyMindDatabase extends Dexie {
  notes!: EntityTable<Note, 'id'>;
  folders!: EntityTable<Folder, 'id'>;
  labels!: EntityTable<Label, 'id'>;
  images!: EntityTable<ImageAttachment, 'id'>;
  syncQueue!: EntityTable<SyncQueueItem, 'id'>;

  constructor() {
    super('LazyMindDB');

    // Define schema version 1
    this.version(1).stores({
      // Notes table
      notes: `
        ++id,
        &uuid,
        createdAt,
        updatedAt,
        syncStatus,
        isTodo,
        isCompleted
      `,

      // Folders table (from #hashtags)
      folders: `
        ++id,
        &name,
        noteCount,
        createdAt
      `,

      // Labels table (from !exclamations)
      labels: `
        ++id,
        &name,
        noteCount,
        createdAt
      `,

      // Image attachments table
      images: `
        ++id,
        &uuid,
        noteId,
        uploadedAt
      `,

      // Sync queue table
      syncQueue: `
        &id,
        status,
        createdAt,
        noteId
      `
    });
  }
}

// Create and export the database instance
export const db = new LazyMindDatabase();

// Export type for use in other files
export type { LazyMindDatabase };

const DEFAULT_FOLDERS = ['scratchpad', 'todo'];

// Initialize database and create default folders
export async function initializeDatabase(): Promise<boolean> {
  try {
    await db.open();

    // Create default folders if they don't exist
    for (const folderName of DEFAULT_FOLDERS) {
      const exists = await db.folders.where('name').equals(folderName).first();
      if (!exists) {
        await db.folders.add({
          name: folderName,
          noteCount: 0,
          createdAt: Date.now(),
        });
      }
    }

    console.log('✓ Database initialized successfully');
    return true;
  } catch (error) {
    console.error('✗ Failed to initialize database:', error);
    return false;
  }
}

// Check if database is ready
export async function isDatabaseReady(): Promise<boolean> {
  try {
    await db.notes.limit(1).toArray();
    return true;
  } catch {
    return false;
  }
}

// Clear all data (useful for testing)
export async function clearAllData(): Promise<void> {
  await db.notes.clear();
  await db.folders.clear();
  await db.labels.clear();
  await db.images.clear();
  console.log('✓ All data cleared');
}

// Get database stats
export async function getDatabaseStats() {
  const [notesCount, foldersCount, labelsCount, imagesCount] = await Promise.all([
    db.notes.count(),
    db.folders.count(),
    db.labels.count(),
    db.images.count()
  ]);

  return {
    notes: notesCount,
    folders: foldersCount,
    labels: labelsCount,
    images: imagesCount,
    total: notesCount + foldersCount + labelsCount + imagesCount
  };
}
