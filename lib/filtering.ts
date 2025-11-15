// Filter system for notes
import type { Note } from '@/types';
import { getAllNotes, searchNotes } from './dbManager';

export interface FilterOptions {
  selectedFolders?: string[];
  selectedLabels?: string[];
  showTodosOnly?: boolean;
  showCompletedOnly?: boolean;
  showImages?: boolean;
}

/**
 * Apply multiple filters to a list of notes
 */
export const applyFilters = async (
  notes: Note[],
  filters: FilterOptions
): Promise<Note[]> => {
  let filtered = notes;

  // Filter by folders
  if (filters.selectedFolders?.length) {
    filtered = filtered.filter(n =>
      filters.selectedFolders!.some(f => n.folders.includes(f))
    );
  }

  // Filter by labels
  if (filters.selectedLabels?.length) {
    filtered = filtered.filter(n =>
      filters.selectedLabels!.some(l => n.labels.includes(l))
    );
  }

  // Filter todos only
  if (filters.showTodosOnly) {
    filtered = filtered.filter(n => n.isTodo);
  }

  // Filter completed only
  if (filters.showCompletedOnly) {
    filtered = filtered.filter(n => n.isCompleted);
  }

  // Filter by images
  if (filters.showImages) {
    filtered = filtered.filter(n => n.imageAttachments.length > 0);
  }

  return filtered;
};

/**
 * Combine search and filters
 * First searches, then applies filters to results
 */
export const searchAndFilter = async (
  query: string,
  filters: FilterOptions
): Promise<Note[]> => {
  // Get notes (either from search or all notes)
  const searchResults = query.trim() ? await searchNotes(query) : await getAllNotes();

  // Apply filters to the search results
  return applyFilters(searchResults, filters);
};

/**
 * Filter notes by multiple criteria (AND operation)
 * All conditions must be met for a note to be included
 */
export const filterNotesByMultipleCriteria = async (filters: {
  folders?: string[];
  labels?: string[];
  isTodo?: boolean;
  isCompleted?: boolean;
  hasImages?: boolean;
}): Promise<Note[]> => {
  const allNotes = await getAllNotes();

  return allNotes.filter(note => {
    // Check folders (note must have at least one of the specified folders)
    if (filters.folders?.length && !filters.folders.some(f => note.folders.includes(f))) {
      return false;
    }

    // Check labels (note must have at least one of the specified labels)
    if (filters.labels?.length && !filters.labels.some(l => note.labels.includes(l))) {
      return false;
    }

    // Check todo status
    if (filters.isTodo !== undefined && note.isTodo !== filters.isTodo) {
      return false;
    }

    // Check completed status
    if (filters.isCompleted !== undefined && note.isCompleted !== filters.isCompleted) {
      return false;
    }

    // Check images
    if (filters.hasImages !== undefined) {
      const hasImages = note.imageAttachments.length > 0;
      if (hasImages !== filters.hasImages) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Get notes that match ALL specified folders (AND operation)
 */
export const getNotesWithAllFolders = async (folders: string[]): Promise<Note[]> => {
  if (folders.length === 0) return getAllNotes();

  const allNotes = await getAllNotes();
  return allNotes.filter(note =>
    folders.every(folder => note.folders.includes(folder))
  );
};

/**
 * Get notes that match ALL specified labels (AND operation)
 */
export const getNotesWithAllLabels = async (labels: string[]): Promise<Note[]> => {
  if (labels.length === 0) return getAllNotes();

  const allNotes = await getAllNotes();
  return allNotes.filter(note =>
    labels.every(label => note.labels.includes(label))
  );
};

/**
 * Get notes that match ANY of the specified folders (OR operation)
 */
export const getNotesWithAnyFolder = async (folders: string[]): Promise<Note[]> => {
  if (folders.length === 0) return getAllNotes();

  const allNotes = await getAllNotes();
  return allNotes.filter(note =>
    folders.some(folder => note.folders.includes(folder))
  );
};

/**
 * Get notes that match ANY of the specified labels (OR operation)
 */
export const getNotesWithAnyLabel = async (labels: string[]): Promise<Note[]> => {
  if (labels.length === 0) return getAllNotes();

  const allNotes = await getAllNotes();
  return allNotes.filter(note =>
    labels.some(label => note.labels.includes(label))
  );
};

/**
 * Sort notes by different criteria
 */
export type SortBy = 'createdAt' | 'updatedAt' | 'alphabetical';
export type SortOrder = 'asc' | 'desc';

export const sortNotes = (
  notes: Note[],
  sortBy: SortBy = 'updatedAt',
  sortOrder: SortOrder = 'desc'
): Note[] => {
  const sorted = [...notes];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'createdAt':
        comparison = a.createdAt - b.createdAt;
        break;
      case 'updatedAt':
        comparison = a.updatedAt - b.updatedAt;
        break;
      case 'alphabetical':
        comparison = a.content.localeCompare(b.content);
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return sorted;
};
