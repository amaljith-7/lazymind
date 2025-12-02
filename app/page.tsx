'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Sidebar } from '@/components/Sidebar';
import { NotesList } from '@/components/NotesList';
import { Editor } from '@/components/Editor';
import { CommandPalette } from '@/components/CommandPalette';
import { GlobalShortcuts } from '@/components/GlobalShortcuts';
import { KeyboardHelpModal } from '@/components/KeyboardHelpModal';

export default function Home() {
  const isInitialized = useStore(state => state.isInitialized);
  const isLoading = useStore(state => state.isLoading);
  const initializeApp = useStore(state => state.initializeApp);

  // Initialize app on mount
  useEffect(() => {
    if (!isInitialized) {
      initializeApp();
    }
  }, [isInitialized, initializeApp]);

  // Show loading state
  if (isLoading || !isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading notes...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Global Keyboard Shortcuts */}
      <GlobalShortcuts />

      {/* Modals */}
      <CommandPalette />
      <KeyboardHelpModal />

      {/* Main App */}
      <div className="flex h-screen bg-[#F8F8F8]">
        {/* Left Sidebar: Tags & Profile */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Notes List & Create Input */}
          <NotesList />
          <Editor />
        </div>
      </div>
    </>
  );
}
