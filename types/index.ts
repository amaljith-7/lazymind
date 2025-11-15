// Core data types for the note-taking application

export interface Note {
  id?: number; // Auto-increment primary key
  uuid: string; // Unique identifier for sync
  content: string;
  folders: string[]; // From #hashtags
  labels: string[]; // From !exclamations
  imageAttachments: string[]; // Image UUIDs
  isTodo: boolean; // Has #todo folder
  isCompleted: boolean;
  completedAt: number | null;
  createdAt: number;
  updatedAt: number;
  syncStatus: 'pending' | 'synced' | 'error';
}

export interface Folder {
  id?: number; // Auto-increment primary key
  name: string; // Unique folder name
  noteCount: number;
  createdAt: number;
}

export interface Label {
  id?: number; // Auto-increment primary key
  name: string; // Unique label name
  color?: string; // Hex color for UI
  noteCount: number;
  createdAt: number;
}

export interface ImageAttachment {
  id?: number; // Auto-increment primary key
  uuid: string; // Unique identifier
  noteId: string; // Reference to note UUID
  fileName: string;
  fileSize: number;
  mimeType: string;
  localPath: string; // Base64 data URL
  uploadedAt: number;
}

export interface SyncStatus {
  isSyncing: boolean;
  pendingChanges: number;
  lastSyncTime: number | null;
  syncError: string | null;
}

// Helper type for creating new notes (omits auto-generated fields)
export type CreateNoteInput = Pick<Note, 'content'> & {
  images?: File[];
};

// Helper type for updating notes (all fields optional except uuid)
export type UpdateNoteInput = Partial<Omit<Note, 'uuid' | 'createdAt'>> & {
  uuid: string;
};

// Parsed note structure
export interface ParsedNote {
  text: string;
  folders: string[];
  labels: string[];
  isTodo: boolean;
}
