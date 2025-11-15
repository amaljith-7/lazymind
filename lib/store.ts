// Global state management using Zustand
'use client';

import { create } from 'zustand';
import type { Note, Folder, Label, SyncStatus } from '@/types';
import * as dbManager from './dbManager';
import { initializeDatabase } from './db';
import { searchAndFilter, type FilterOptions } from './filtering';

export type InputMode = 'input' | 'search';

interface AppState {
  // UI State
  selectedNoteUuid: string | null;
  selectedFolder: string | null;
  selectedLabel: string | null;
  inputMode: InputMode; // 'input' or 'search'
  isLoading: boolean;
  syncStatus: SyncStatus;
  searchQuery: string;
  isCommandPaletteOpen: boolean;
  isKeyboardHelpOpen: boolean;

  // Data
  notes: Note[];
  folders: Folder[];
  labels: Label[];
  filteredNotes: Note[];

  // Filter Options
  filterOptions: FilterOptions;

  // Initialization
  isInitialized: boolean;
  initializeApp: () => Promise<void>;

  // Note Actions
  setSelectedNote: (uuid: string | null) => void;
  createNote: (content: string, images?: File[]) => Promise<Note>;
  updateNote: (uuid: string, content: string, images?: File[]) => Promise<void>;
  deleteNote: (uuid: string) => Promise<void>;
  refreshNotes: () => Promise<void>;
  toggleTodoCompletion: (uuid: string) => Promise<void>;

  // Folder Actions
  setSelectedFolder: (folder: string | null) => void;
  refreshFolders: () => Promise<void>;

  // Label Actions
  setSelectedLabel: (label: string | null) => void;
  refreshLabels: () => Promise<void>;

  // Filter Actions
  setFilterOptions: (options: FilterOptions) => void;
  clearFilters: () => void;
  applyFilters: () => Promise<void>;

  // Search Actions
  setSearchQuery: (query: string) => void;
  toggleInputMode: () => void;
  setInputMode: (mode: InputMode) => void;

  // UI Actions
  setCommandPaletteOpen: (open: boolean) => void;
  setKeyboardHelpOpen: (open: boolean) => void;

  // Sync Actions (simplified - no queue)
  updateSyncStatus: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial State
  selectedNoteUuid: null,
  selectedFolder: null,
  selectedLabel: null,
  inputMode: 'input',
  isLoading: false,
  syncStatus: {
    isSyncing: false,
    pendingChanges: 0,
    lastSyncTime: null,
    syncError: null
  },
  searchQuery: '',
  isCommandPaletteOpen: false,
  isKeyboardHelpOpen: false,
  notes: [],
  folders: [],
  labels: [],
  filteredNotes: [],
  filterOptions: {},
  isInitialized: false,

  // Initialize the app
  initializeApp: async () => {
    set({ isLoading: true });

    try {
      // Initialize database (creates default folders)
      await initializeDatabase();

      // Load initial data
      const [notes, folders, labels] = await Promise.all([
        dbManager.getAllNotes(),
        dbManager.getAllFolders(),
        dbManager.getAllLabels()
      ]);

      set({
        notes,
        folders,
        labels,
        filteredNotes: notes,
        isInitialized: true,
        isLoading: false
      });

      console.log('✓ App initialized successfully');
      console.log(`  - ${notes.length} notes`);
      console.log(`  - ${folders.length} folders`);
      console.log(`  - ${labels.length} labels`);
    } catch (error) {
      console.error('✗ Failed to initialize app:', error);
      set({ isLoading: false });
    }
  },

  // Note Actions
  setSelectedNote: (uuid) => {
    set({ selectedNoteUuid: uuid });
  },

  createNote: async (content, images) => {
    console.log('[Store] Creating new note...');
    const note = await dbManager.createNote(content, images);
    console.log('[Store] Note created:', note.uuid);

    // Refresh data
    await get().refreshNotes();
    await get().refreshFolders();
    await get().refreshLabels();

    // Auto-select the new note
    set({ selectedNoteUuid: note.uuid });

    // Switch back to input mode after creating
    set({ inputMode: 'input', searchQuery: '' });

    return note;
  },

  updateNote: async (uuid, content, images) => {
    await dbManager.updateNote(uuid, content, images);

    // Refresh data
    await get().refreshNotes();
    await get().refreshFolders();
    await get().refreshLabels();
  },

  deleteNote: async (uuid) => {
    await dbManager.deleteNote(uuid);

    // Clear selection if deleted note was selected
    if (get().selectedNoteUuid === uuid) {
      set({ selectedNoteUuid: null });
    }

    // Refresh data
    await get().refreshNotes();
    await get().refreshFolders();
    await get().refreshLabels();
  },

  refreshNotes: async () => {
    const notes = await dbManager.getAllNotes();
    set({ notes });
    await get().applyFilters();
  },

  toggleTodoCompletion: async (uuid) => {
    await dbManager.toggleTodoCompletion(uuid);
    await get().refreshNotes();
  },

  // Folder Actions
  setSelectedFolder: (folder) => {
    set({ selectedFolder: folder, selectedLabel: null, searchQuery: '' });
    get().applyFilters();
  },

  refreshFolders: async () => {
    const folders = await dbManager.getAllFolders();
    set({ folders });
  },

  // Label Actions
  setSelectedLabel: (label) => {
    set({ selectedLabel: label, selectedFolder: null, searchQuery: '' });
    get().applyFilters();
  },

  refreshLabels: async () => {
    const labels = await dbManager.getAllLabels();
    set({ labels });
  },

  // Filter Actions
  setFilterOptions: (options) => {
    set({ filterOptions: options });
    get().applyFilters();
  },

  clearFilters: () => {
    set({
      filterOptions: {},
      selectedFolder: null,
      selectedLabel: null,
      searchQuery: ''
    });
    get().applyFilters();
  },

  applyFilters: async () => {
    const { notes, selectedFolder, selectedLabel, searchQuery, filterOptions } = get();

    // Build combined filter options
    const combinedFilters: FilterOptions = {
      ...filterOptions,
      selectedFolders: selectedFolder ? [selectedFolder] : filterOptions.selectedFolders,
      selectedLabels: selectedLabel ? [selectedLabel] : filterOptions.selectedLabels,
    };

    // Apply search and filters
    const filtered = await searchAndFilter(searchQuery, combinedFilters);
    set({ filteredNotes: filtered });
  },

  // Search Actions
  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().applyFilters();
  },

  toggleInputMode: () => {
    const currentMode = get().inputMode;
    const newMode = currentMode === 'input' ? 'search' : 'input';
    set({ inputMode: newMode });

    // Clear search when switching to input mode
    if (newMode === 'input') {
      set({ searchQuery: '' });
      get().applyFilters();
    }
  },

  setInputMode: (mode) => {
    set({ inputMode: mode });

    // Clear search when switching to input mode
    if (mode === 'input') {
      set({ searchQuery: '' });
      get().applyFilters();
    }
  },

  // UI Actions
  setCommandPaletteOpen: (open) => {
    set({ isCommandPaletteOpen: open });
  },

  setKeyboardHelpOpen: (open) => {
    set({ isKeyboardHelpOpen: open });
  },

  // Sync Actions (simplified)
  updateSyncStatus: () => {
    const { notes } = get();
    const pendingChanges = notes.filter(n => n.syncStatus === 'pending').length;

    set({
      syncStatus: {
        isSyncing: false,
        pendingChanges,
        lastSyncTime: null,
        syncError: null
      }
    });
  }
}));

// Selectors for optimized component re-renders
export const selectNotes = (state: AppState) => state.filteredNotes;
export const selectFolders = (state: AppState) => state.folders;
export const selectLabels = (state: AppState) => state.labels;
export const selectSelectedNote = (state: AppState) =>
  state.notes.find(n => n.uuid === state.selectedNoteUuid) || null;
export const selectSyncStatus = (state: AppState) => state.syncStatus;
export const selectIsLoading = (state: AppState) => state.isLoading;
export const selectInputMode = (state: AppState) => state.inputMode;
export const selectSearchQuery = (state: AppState) => state.searchQuery;
