// Database manager with CRUD operations for notes, folders, labels, and images
import { db } from './db';
import {
  parseNoteInput,
  generateUUID,
  generateRandomColor,
  normalizeFolderName,
  normalizeLabelName
} from './noteParsing';
import type { Note, Folder, Label, ImageAttachment, CreateNoteInput, UpdateNoteInput } from '@/types';

// ============================================================================
// NOTE OPERATIONS
// ============================================================================

/**
 * Create a new note with optional images
 */
export async function createNote(
  content: string,
  images?: File[]
): Promise<Note> {
  // Parse the input to extract folders and labels
  const parsed = parseNoteInput(content);

  // Create note object
  const note: Note = {
    uuid: generateUUID(),
    content: parsed.text,
    folders: parsed.folders,
    labels: parsed.labels,
    imageAttachments: images ? images.map(() => generateUUID()) : [],
    isTodo: parsed.isTodo,
    isCompleted: false,
    completedAt: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    syncStatus: 'pending',
  };

  // Use transaction to ensure atomicity
  await db.transaction('rw', [db.notes, db.folders, db.labels, db.images], async () => {
    // Ensure folders exist (create if new)
    for (const folderName of parsed.folders) {
      const exists = await db.folders.where('name').equals(folderName).first();
      if (!exists) {
        await db.folders.add({
          name: folderName,
          noteCount: 0,
          createdAt: Date.now(),
        });
      }
    }

    // Ensure labels exist (create if new)
    for (const labelName of parsed.labels) {
      const exists = await db.labels.where('name').equals(labelName).first();
      if (!exists) {
        await db.labels.add({
          name: labelName,
          color: generateRandomColor(),
          noteCount: 0,
          createdAt: Date.now(),
        });
      }
    }

    // Store images if provided
    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const imageUuid = note.imageAttachments[i];
        const file = images[i];

        await db.images.add({
          uuid: imageUuid,
          noteId: note.uuid,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          localPath: await fileToBase64(file), // Store as base64
          uploadedAt: Date.now(),
        });
      }
    }

    // Add note to database
    await db.notes.add(note);

    // Update folder/label counts
    await updateFolderCounts(parsed.folders);
    await updateLabelCounts(parsed.labels);
  });

  return note;
}

/**
 * Update an existing note
 */
export async function updateNote(
  noteUuid: string,
  newContent: string,
  newImages?: File[]
): Promise<Note | null> {
  const note = await db.notes.where('uuid').equals(noteUuid).first();
  if (!note) {
    throw new Error('Note not found');
  }

  // Parse new content
  const parsed = parseNoteInput(newContent);

  // Save old folders/labels for count updates
  const oldFolders = note.folders;
  const oldLabels = note.labels;

  await db.transaction('rw', [db.notes, db.folders, db.labels, db.images], async () => {
    // Ensure new folders exist
    for (const folderName of parsed.folders) {
      const exists = await db.folders.where('name').equals(folderName).first();
      if (!exists) {
        await db.folders.add({
          name: folderName,
          noteCount: 0,
          createdAt: Date.now(),
        });
      }
    }

    // Ensure new labels exist
    for (const labelName of parsed.labels) {
      const exists = await db.labels.where('name').equals(labelName).first();
      if (!exists) {
        await db.labels.add({
          name: labelName,
          color: generateRandomColor(),
          noteCount: 0,
          createdAt: Date.now(),
        });
      }
    }

    // Handle images
    let imageUuids = note.imageAttachments;
    if (newImages) {
      // Remove old images
      await db.images.where('noteId').equals(noteUuid).delete();

      // Add new images
      imageUuids = newImages.map(() => generateUUID());
      for (let i = 0; i < newImages.length; i++) {
        const file = newImages[i];
        await db.images.add({
          uuid: imageUuids[i],
          noteId: noteUuid,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          localPath: await fileToBase64(file),
          uploadedAt: Date.now(),
        });
      }
    }

    // Update note
    await db.notes.update(note.id!, {
      content: parsed.text,
      folders: parsed.folders,
      labels: parsed.labels,
      isTodo: parsed.isTodo,
      imageAttachments: imageUuids,
      updatedAt: Date.now(),
      syncStatus: 'pending',
    });

    // Update counts for old and new folders/labels
    await updateFolderCounts([...oldFolders, ...parsed.folders]);
    await updateLabelCounts([...oldLabels, ...parsed.labels]);
  });

  return db.notes.where('uuid').equals(noteUuid).first() as Promise<Note>;
}

/**
 * Delete note (hard delete)
 */
export async function deleteNote(noteUuid: string): Promise<void> {
  const note = await db.notes.where('uuid').equals(noteUuid).first();
  if (!note) {
    throw new Error('Note not found');
  }

  await db.transaction('rw', [db.notes, db.folders, db.labels, db.images], async () => {
    // Delete associated images
    await db.images.where('noteId').equals(noteUuid).delete();

    // Delete note
    await db.notes.delete(note.id!);

    // Update folder/label counts
    await updateFolderCounts(note.folders);
    await updateLabelCounts(note.labels);
  });
}

/**
 * Get a single note by UUID
 */
export async function getNoteByUuid(uuid: string): Promise<Note | null> {
  return (await db.notes.where('uuid').equals(uuid).first()) || null;
}

/**
 * Get all notes
 */
export async function getAllNotes(): Promise<Note[]> {
  return db.notes.orderBy('createdAt').reverse().toArray();
}

/**
 * Get notes by specific folder
 */
export async function getNotesByFolder(folderName: string): Promise<Note[]> {
  const allNotes = await db.notes.toArray();
  return allNotes
    .filter(n => n.folders.includes(folderName))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Get notes by specific label
 */
export async function getNotesByLabel(labelName: string): Promise<Note[]> {
  const allNotes = await db.notes.toArray();
  return allNotes
    .filter(n => n.labels.includes(labelName))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Search notes by content (case-insensitive)
 */
export async function searchNotes(query: string): Promise<Note[]> {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase();
  const notes = await db.notes.toArray();

  return notes
    .filter(n =>
      n.content.toLowerCase().includes(lowerQuery) ||
      n.folders.some(f => f.toLowerCase().includes(lowerQuery)) ||
      n.labels.some(l => l.toLowerCase().includes(lowerQuery))
    )
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Get todos (notes with #todo folder)
 */
export async function getTodos(): Promise<Note[]> {
  const allNotes = await db.notes.toArray();
  return allNotes
    .filter(n => n.isTodo && !n.isCompleted)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Get completed todos
 */
export async function getCompletedTodos(): Promise<Note[]> {
  const allNotes = await db.notes.toArray();
  return allNotes
    .filter(n => n.isTodo && n.isCompleted)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Toggle todo completion status
 */
export async function toggleTodoCompletion(noteUuid: string): Promise<void> {
  const note = await db.notes.where('uuid').equals(noteUuid).first();
  if (!note) {
    throw new Error('Note not found');
  }

  await db.notes.update(note.id!, {
    isCompleted: !note.isCompleted,
    completedAt: !note.isCompleted ? Date.now() : null,
    updatedAt: Date.now(),
    syncStatus: 'pending',
  });
}

/**
 * Mark todo as complete
 */
export async function markTodoComplete(noteUuid: string): Promise<void> {
  const note = await db.notes.where('uuid').equals(noteUuid).first();
  if (!note) {
    throw new Error('Note not found');
  }

  await db.notes.update(note.id!, {
    isCompleted: true,
    completedAt: Date.now(),
    updatedAt: Date.now(),
    syncStatus: 'pending',
  });
}

/**
 * Mark todo as incomplete
 */
export async function markTodoIncomplete(noteUuid: string): Promise<void> {
  const note = await db.notes.where('uuid').equals(noteUuid).first();
  if (!note) {
    throw new Error('Note not found');
  }

  await db.notes.update(note.id!, {
    isCompleted: false,
    completedAt: null,
    updatedAt: Date.now(),
    syncStatus: 'pending',
  });
}

// ============================================================================
// FOLDER OPERATIONS
// ============================================================================

/**
 * Get all folders with metadata
 */
export async function getAllFolders(): Promise<Folder[]> {
  return db.folders.toArray();
}

/**
 * Get folder by name
 */
export async function getFolderByName(name: string): Promise<Folder | null> {
  return (await db.folders.where('name').equals(name).first()) || null;
}

/**
 * Create folder
 */
export async function createFolder(name: string): Promise<Folder> {
  const normalizedName = normalizeFolderName(name);
  const existing = await getFolderByName(normalizedName);

  if (existing) {
    return existing;
  }

  const folder: Folder = {
    name: normalizedName,
    noteCount: 0,
    createdAt: Date.now(),
  };

  await db.folders.add(folder);
  return folder;
}

// ============================================================================
// LABEL OPERATIONS
// ============================================================================

/**
 * Get all labels with metadata
 */
export async function getAllLabels(): Promise<Label[]> {
  return db.labels.toArray();
}

/**
 * Get label by name
 */
export async function getLabelByName(name: string): Promise<Label | null> {
  return (await db.labels.where('name').equals(name).first()) || null;
}

/**
 * Create label
 */
export async function createLabel(name: string, color?: string): Promise<Label> {
  const normalizedName = normalizeLabelName(name);
  const existing = await getLabelByName(normalizedName);

  if (existing) {
    return existing;
  }

  const label: Label = {
    name: normalizedName,
    color: color || generateRandomColor(),
    noteCount: 0,
    createdAt: Date.now(),
  };

  await db.labels.add(label);
  return label;
}

/**
 * Update label color
 */
export async function updateLabelColor(name: string, color: string): Promise<boolean> {
  const label = await getLabelByName(name);
  if (!label || !label.id) {
    return false;
  }

  await db.labels.update(label.id, { color });
  return true;
}

// ============================================================================
// IMAGE OPERATIONS
// ============================================================================

/**
 * Get images for a specific note
 */
export async function getImagesForNote(noteUuid: string): Promise<ImageAttachment[]> {
  return db.images.where('noteId').equals(noteUuid).toArray();
}

/**
 * Get image by UUID
 */
export async function getImageByUuid(uuid: string): Promise<ImageAttachment | null> {
  return (await db.images.where('uuid').equals(uuid).first()) || null;
}

/**
 * Get image URL (returns base64 data URL)
 */
export async function getImageUrl(imageUuid: string): Promise<string> {
  const image = await getImageByUuid(imageUuid);
  return image?.localPath || '';
}

/**
 * Delete image
 */
export async function deleteImage(imageUuid: string): Promise<void> {
  const image = await getImageByUuid(imageUuid);
  if (image && image.id) {
    await db.images.delete(image.id);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Update folder counts based on current note associations
 */
async function updateFolderCounts(folderNames: string[]): Promise<void> {
  for (const folderName of folderNames) {
    const count = await db.notes
      .filter(n => n.folders.includes(folderName))
      .count();

    const folder = await db.folders.where('name').equals(folderName).first();
    if (folder?.id) {
      await db.folders.update(folder.id, { noteCount: count });
    }
  }
}

/**
 * Update label counts based on current note associations
 */
async function updateLabelCounts(labelNames: string[]): Promise<void> {
  for (const labelName of labelNames) {
    const count = await db.notes
      .filter(n => n.labels.includes(labelName))
      .count();

    const label = await db.labels.where('name').equals(labelName).first();
    if (label?.id) {
      await db.labels.update(label.id, { noteCount: count });
    }
  }
}

/**
 * Convert File to base64 data URL
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Refresh all data (for use after major operations)
 */
export async function refreshAllData() {
  return {
    folders: await getAllFolders(),
    labels: await getAllLabels(),
    notes: await getAllNotes(),
  };
}

// ============================================================================
// TAG OPERATIONS (Stubs for tagService.ts compatibility)
// Note: Tags are folders in this implementation
// ============================================================================

/**
 * Get all tags (returns all folders)
 */
export async function getAllTags(): Promise<Folder[]> {
  return getAllFolders();
}

/**
 * Get tag by name (returns folder by name)
 */
export async function getTagById(tagName: string): Promise<Folder | null> {
  return (await db.folders.where('name').equals(tagName).first()) || null;
}

/**
 * Get or create a tag (folder)
 */
export async function getOrCreateTag(tagName: string): Promise<Folder> {
  const normalized = normalizeFolderName(tagName);
  const existing = await db.folders.where('name').equals(normalized).first();
  
  if (existing) {
    return existing;
  }

  const folder: Folder = {
    name: normalized,
    noteCount: 0,
    createdAt: Date.now(),
  };

  const id = await db.folders.add(folder);
  return { ...folder, id };
}

/**
 * Delete a tag (folder)
 */
export async function deleteTag(tagName: string, skipCountUpdate?: boolean): Promise<boolean> {
  const folder = await db.folders.where('name').equals(tagName).first();
  
  if (!folder || !folder.id) {
    return false;
  }

  await db.folders.delete(folder.id);
  return true;
}

/**
 * Update tag color (stub - Folder type doesn't have color field)
 */
export async function updateTagColor(tagName: string, color: string): Promise<boolean> {
  // Stub implementation - Folder type doesn't support color in current schema
  console.warn('updateTagColor is not implemented - Folder type does not have color field');
  return false;
}
