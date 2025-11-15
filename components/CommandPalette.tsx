'use client';

import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { useKeyboardShortcuts, formatShortcut } from '@/lib/useKeyboardShortcuts';
import type { KeyboardShortcut } from '@/lib/useKeyboardShortcuts';

interface Command extends KeyboardShortcut {
  id: string;
  icon?: string;
}

export function CommandPalette() {
  const isOpen = useStore(state => state.isCommandPaletteOpen);
  const setOpen = useStore(state => state.setCommandPaletteOpen);
  const createNote = useStore(state => state.createNote);
  const setSelectedLabel = useStore(state => state.setSelectedLabel);
  const setKeyboardHelpOpen = useStore(state => state.setKeyboardHelpOpen);
  const updateSyncStatus = useStore(state => state.updateSyncStatus);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Define all available commands
  const allCommands: Command[] = [
    {
      id: 'new-note',
      key: 'n',
      ctrl: true,
      action: () => {
        createNote('');
        setOpen(false);
      },
      description: 'Create new note',
      category: 'note',
      icon: '📝'
    },
    {
      id: 'show-all',
      key: 'a',
      ctrl: true,
      action: () => {
        setSelectedLabel(null);
        setOpen(false);
      },
      description: 'Show all notes',
      category: 'navigation',
      icon: '📋'
    },
    {
      id: 'sync',
      key: 's',
      ctrl: true,
      shift: true,
      action: () => {
        updateSyncStatus();
        setOpen(false);
      },
      description: 'Sync now',
      category: 'ui',
      icon: '🔄'
    },
    {
      id: 'keyboard-help',
      key: '?',
      ctrl: true,
      action: () => {
        setKeyboardHelpOpen(true);
        setOpen(false);
      },
      description: 'Show keyboard shortcuts',
      category: 'ui',
      icon: '⌨️'
    }
  ];

  // Fuzzy search implementation
  const fuzzyMatch = (str: string, pattern: string): boolean => {
    const p = pattern.toLowerCase();
    const s = str.toLowerCase();

    let patternIdx = 0;
    let strIdx = 0;

    while (patternIdx < p.length && strIdx < s.length) {
      if (p[patternIdx] === s[strIdx]) {
        patternIdx++;
      }
      strIdx++;
    }

    return patternIdx === p.length;
  };

  // Filter commands based on query
  const filteredCommands = query
    ? allCommands.filter(
        cmd =>
          fuzzyMatch(cmd.description, query) ||
          fuzzyMatch(cmd.id, query) ||
          (cmd.category && fuzzyMatch(cmd.category, query))
      )
    : allCommands;

  // Reset selected index when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation within palette
  useKeyboardShortcuts(
    [
      {
        key: 'ArrowDown',
        action: () => {
          setSelectedIndex(prev =>
            Math.min(prev + 1, filteredCommands.length - 1)
          );
        },
        description: 'Move down',
        preventInInput: false
      },
      {
        key: 'ArrowUp',
        action: () => {
          setSelectedIndex(prev => Math.max(prev - 1, 0));
        },
        description: 'Move up',
        preventInInput: false
      },
      {
        key: 'Enter',
        action: () => {
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
          }
        },
        description: 'Execute command',
        preventInInput: false
      },
      {
        key: 'Escape',
        action: () => {
          setOpen(false);
        },
        description: 'Close palette',
        preventInInput: false
      }
    ],
    { enabled: isOpen }
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Search input */}
          <div className="border-b border-gray-200 dark:border-gray-800">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Type a command or search..."
              className="w-full px-6 py-4 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none text-lg"
            />
          </div>

          {/* Commands list */}
          <div className="max-h-96 overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-500">
                No commands found
              </div>
            ) : (
              filteredCommands.map((command, index) => (
                <button
                  key={command.id}
                  onClick={() => command.action()}
                  className={`w-full px-6 py-3 flex items-center justify-between transition-colors ${
                    index === selectedIndex
                      ? 'bg-blue-50 dark:bg-blue-900/30'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {command.icon && (
                      <span className="text-xl">{command.icon}</span>
                    )}
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {command.description}
                      </div>
                      {command.category && (
                        <div className="text-xs text-gray-500 dark:text-gray-500 capitalize">
                          {command.category}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-500 font-mono">
                    {formatShortcut(command)}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
            <div className="flex items-center gap-4">
              <span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                  ↑↓
                </kbd>{' '}
                to navigate
              </span>
              <span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                  Enter
                </kbd>{' '}
                to select
              </span>
              <span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                  Esc
                </kbd>{' '}
                to close
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
