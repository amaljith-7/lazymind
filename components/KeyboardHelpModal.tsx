'use client';

import { useStore } from '@/lib/store';
import { formatShortcut } from '@/lib/useKeyboardShortcuts';
import type { KeyboardShortcut } from '@/lib/useKeyboardShortcuts';

export function KeyboardHelpModal() {
  const isOpen = useStore(state => state.isKeyboardHelpOpen);
  const setOpen = useStore(state => state.setKeyboardHelpOpen);

  // All shortcuts organized by category
  const shortcuts: Record<string, KeyboardShortcut[]> = {
    Navigation: [
      {
        key: 'k',
        ctrl: true,
        action: () => {},
        description: 'Open command palette'
      },
      {
        key: 'n',
        ctrl: true,
        action: () => {},
        description: 'Create new note'
      },
      {
        key: 'a',
        ctrl: true,
        action: () => {},
        description: 'Show all notes'
      },
      {
        key: 'ArrowUp',
        action: () => {},
        description: 'Previous note'
      },
      {
        key: 'ArrowDown',
        action: () => {},
        description: 'Next note'
      },
      {
        key: 'Escape',
        action: () => {},
        description: 'Deselect note / Close modal'
      }
    ],
    Editor: [
      {
        key: 'b',
        ctrl: true,
        action: () => {},
        description: 'Bold text'
      },
      {
        key: 'i',
        ctrl: true,
        action: () => {},
        description: 'Italic text'
      },
      {
        key: 'e',
        ctrl: true,
        action: () => {},
        description: 'Inline code'
      },
      {
        key: '1',
        ctrl: true,
        shift: true,
        action: () => {},
        description: 'Heading 1'
      },
      {
        key: '2',
        ctrl: true,
        shift: true,
        action: () => {},
        description: 'Heading 2'
      },
      {
        key: '3',
        ctrl: true,
        shift: true,
        action: () => {},
        description: 'Heading 3'
      }
    ],
    'Note Management': [
      {
        key: 'Delete',
        ctrl: true,
        action: () => {},
        description: 'Delete current note'
      },
      {
        key: 's',
        ctrl: true,
        shift: true,
        action: () => {},
        description: 'Sync now'
      }
    ],
    UI: [
      {
        key: '?',
        ctrl: true,
        shift: true,
        action: () => {},
        description: 'Show this help'
      }
    ]
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={() => setOpen(false)}
      />

      {/* Modal */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-3xl z-50">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl leading-none"
              >
                ×
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[70vh] overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {Object.entries(shortcuts).map(([category, categoryShortcuts]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {categoryShortcuts.map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2"
                      >
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {shortcut.description}
                        </span>
                        <kbd className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-xs font-mono text-gray-700 dark:text-gray-300">
                          {formatShortcut(shortcut)}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Press{' '}
              <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-xs">
                Esc
              </kbd>{' '}
              to close
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
