'use client';

import { useStore } from '@/lib/store';
import { useKeyboardShortcuts } from '@/lib/useKeyboardShortcuts';

/**
 * Global keyboard shortcuts component
 * This component doesn't render anything, it just sets up keyboard listeners
 */
export function GlobalShortcuts() {
  const setCommandPaletteOpen = useStore(state => state.setCommandPaletteOpen);
  const setKeyboardHelpOpen = useStore(state => state.setKeyboardHelpOpen);
  const createNote = useStore(state => state.createNote);
  const clearFilters = useStore(state => state.clearFilters);
  const toggleInputMode = useStore(state => state.toggleInputMode);
  const setSelectedNote = useStore(state => state.setSelectedNote);
  const deleteNote = useStore(state => state.deleteNote);
  const selectedNoteUuid = useStore(state => state.selectedNoteUuid);
  const filteredNotes = useStore(state => state.filteredNotes);

  // Define global shortcuts
  useKeyboardShortcuts([
    // Command Palette
    {
      key: 'k',
      ctrl: true,
      action: () => setCommandPaletteOpen(true),
      description: 'Open command palette',
      category: 'ui',
      preventInInput: false
    },

    // Toggle Search Mode
    {
      key: 'f',
      ctrl: true,
      action: () => toggleInputMode(),
      description: 'Toggle search mode',
      category: 'ui',
      preventInInput: false
    },

    // New Note
    {
      key: 'n',
      ctrl: true,
      action: () => createNote(''),
      description: 'Create new note',
      category: 'note',
      preventInInput: false
    },

    // Show All Notes
    {
      key: 'a',
      ctrl: true,
      action: () => clearFilters(),
      description: 'Show all notes',
      category: 'navigation'
    },

    // Keyboard Help
    {
      key: '?',
      ctrl: true,
      shift: true,
      action: () => setKeyboardHelpOpen(true),
      description: 'Show keyboard shortcuts',
      category: 'ui'
    },

    // Delete Current Note
    {
      key: 'Delete',
      ctrl: true,
      action: () => {
        if (selectedNoteUuid) {
          const confirmed = confirm('Delete this note?');
          if (confirmed) {
            deleteNote(selectedNoteUuid);
          }
        }
      },
      description: 'Delete current note',
      category: 'note'
    },

    // Navigate notes with arrow keys (when not in editor)
    {
      key: 'ArrowUp',
      action: () => {
        if (!selectedNoteUuid && filteredNotes.length > 0) {
          setSelectedNote(filteredNotes[0].uuid);
        } else if (selectedNoteUuid) {
          const currentIndex = filteredNotes.findIndex(
            n => n.uuid === selectedNoteUuid
          );
          if (currentIndex > 0) {
            setSelectedNote(filteredNotes[currentIndex - 1].uuid);
          }
        }
      },
      description: 'Previous note',
      category: 'navigation'
    },

    {
      key: 'ArrowDown',
      action: () => {
        if (!selectedNoteUuid && filteredNotes.length > 0) {
          setSelectedNote(filteredNotes[0].uuid);
        } else if (selectedNoteUuid) {
          const currentIndex = filteredNotes.findIndex(
            n => n.uuid === selectedNoteUuid
          );
          if (currentIndex < filteredNotes.length - 1) {
            setSelectedNote(filteredNotes[currentIndex + 1].uuid);
          }
        }
      },
      description: 'Next note',
      category: 'navigation'
    },

    // Deselect / Clear
    {
      key: 'Escape',
      action: () => setSelectedNote(null),
      description: 'Deselect note',
      category: 'navigation'
    }
  ]);

  // This component doesn't render anything
  return null;
}
