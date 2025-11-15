// Custom hook for keyboard shortcuts management
'use client';

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string; // Main key (e.g., "k", "n", "/")
  ctrl?: boolean; // Ctrl key (maps to Cmd on Mac)
  shift?: boolean;
  alt?: boolean;
  meta?: boolean; // Explicit Cmd/Win key
  action: () => void;
  description: string;
  category?: 'navigation' | 'editor' | 'note' | 'ui';
  preventInInput?: boolean; // If true, don't trigger when in input/textarea
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  ignoreInputFields?: boolean; // Global override to allow shortcuts in input fields
}

/**
 * Custom hook for registering keyboard shortcuts
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true, ignoreInputFields = false } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Check if we're in an input field
      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true';

      for (const shortcut of shortcuts) {
        // Skip if in input field and shortcut doesn't allow it
        if (
          isInputField &&
          !ignoreInputFields &&
          shortcut.preventInInput !== false
        ) {
          // Some shortcuts should work everywhere (like Cmd+K)
          if (!shortcut.ctrl && !shortcut.meta) {
            continue;
          }
        }

        // Check if keys match
        const keyMatches =
          event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrl
          ? isMac()
            ? event.metaKey
            : event.ctrlKey
          : true;
        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatches = shortcut.alt ? event.altKey : !event.altKey;
        const metaMatches = shortcut.meta ? event.metaKey : true;

        if (
          keyMatches &&
          ctrlMatches &&
          shiftMatches &&
          altMatches &&
          metaMatches
        ) {
          event.preventDefault();
          event.stopPropagation();
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts, enabled, ignoreInputFields]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}

/**
 * Check if running on Mac
 */
export function isMac(): boolean {
  if (typeof window === 'undefined') return false;
  return /Mac|iPhone|iPod|iPad/.test(navigator.platform);
}

/**
 * Get modifier key symbol (⌘ for Mac, Ctrl for others)
 */
export function getModifierSymbol(): string {
  return isMac() ? '⌘' : 'Ctrl';
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrl || shortcut.meta) {
    parts.push(getModifierSymbol());
  }

  if (shortcut.shift) {
    parts.push('Shift');
  }

  if (shortcut.alt) {
    parts.push('Alt');
  }

  parts.push(shortcut.key.toUpperCase());

  return parts.join('+');
}

/**
 * Group shortcuts by category
 */
export function groupShortcutsByCategory(
  shortcuts: KeyboardShortcut[]
): Record<string, KeyboardShortcut[]> {
  const grouped: Record<string, KeyboardShortcut[]> = {
    navigation: [],
    editor: [],
    note: [],
    ui: [],
    other: []
  };

  shortcuts.forEach(shortcut => {
    const category = shortcut.category || 'other';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(shortcut);
  });

  return grouped;
}

/**
 * Check if shortcut key combination is valid
 */
export function isValidShortcut(shortcut: KeyboardShortcut): boolean {
  // Must have a key
  if (!shortcut.key || shortcut.key.length === 0) return false;

  // Must have at least one modifier or be a special key
  const specialKeys = ['Escape', 'Enter', 'ArrowUp', 'ArrowDown', 'Tab'];
  const hasModifier = shortcut.ctrl || shortcut.shift || shortcut.alt || shortcut.meta;

  return hasModifier || specialKeys.includes(shortcut.key);
}

/**
 * Detect shortcut conflicts
 */
export function findShortcutConflicts(
  shortcuts: KeyboardShortcut[]
): Array<[KeyboardShortcut, KeyboardShortcut]> {
  const conflicts: Array<[KeyboardShortcut, KeyboardShortcut]> = [];

  for (let i = 0; i < shortcuts.length; i++) {
    for (let j = i + 1; j < shortcuts.length; j++) {
      const a = shortcuts[i];
      const b = shortcuts[j];

      if (
        a.key.toLowerCase() === b.key.toLowerCase() &&
        !!a.ctrl === !!b.ctrl &&
        !!a.shift === !!b.shift &&
        !!a.alt === !!b.alt &&
        !!a.meta === !!b.meta
      ) {
        conflicts.push([a, b]);
      }
    }
  }

  return conflicts;
}
