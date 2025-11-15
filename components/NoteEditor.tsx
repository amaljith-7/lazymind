'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore, selectSelectedNote, selectFolders, selectLabels } from '@/lib/store';
import { extractFolders, extractLabels } from '@/lib/noteParsing';
import { getImagesForNote, getImageUrl } from '@/lib/dbManager';
import { X, Trash2, Image as ImageIcon } from 'lucide-react';
import type { ImageAttachment } from '@/types';

export function NoteEditor() {
  const note = useStore(selectSelectedNote);
  const folders = useStore(selectFolders);
  const labels = useStore(selectLabels);
  const updateNote = useStore(state => state.updateNote);
  const deleteNote = useStore(state => state.deleteNote);
  const setSelectedNote = useStore(state => state.setSelectedNote);

  const [content, setContent] = useState('');
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update local content and load images when note changes
  useEffect(() => {
    if (note) {
      setContent(note.content);
      setLastSaved(note.updatedAt);

      // Load images
      getImagesForNote(note.uuid).then(setImages);
    } else {
      setContent('');
      setImages([]);
      setLastSaved(null);
    }
  }, [note]);

  // Auto-save with debounce
  const saveNote = useCallback(async (newContent: string) => {
    if (!note) return;

    setIsSaving(true);

    try {
      await updateNote(note.uuid, newContent);
      setLastSaved(Date.now());
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setIsSaving(false);
    }
  }, [note, updateNote]);

  // Handle content change with debounced save
  const handleContentChange = (newContent: string) => {
    setContent(newContent);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveNote(newContent);
    }, 500);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Format last saved time
  const getLastSavedText = () => {
    if (!lastSaved) return '';

    const now = Date.now();
    const diff = now - lastSaved;
    const seconds = Math.floor(diff / 1000);

    if (isSaving) return 'Saving...';
    if (seconds < 2) return '✓ Saved';
    if (seconds < 60) return `Saved ${seconds}s ago`;
    return 'Saved';
  };

  // Handle delete
  const handleDelete = async () => {
    if (!note) return;

    const confirmed = confirm('Are you sure you want to delete this note?');
    if (confirmed) {
      await deleteNote(note.uuid);
      setSelectedNote(null);
    }
  };

  // Handle close
  const handleClose = () => {
    setSelectedNote(null);
  };

  // Extract folders and labels from current content
  const currentFolders = content ? extractFolders(content) : [];
  const currentLabels = content ? extractLabels(content) : [];

  // Get folder color
  const getFolderColor = (folderName: string) => {
    const colorMap: Record<string, string> = {
      'scratchpad': '#DA6969',
      'todo': '#7992E6',
      'movies': '#D366E4',
      'books': '#D7AF57',
      'thoughts': '#DF9372',
      'work': '#6BC4A6',
    };
    return colorMap[folderName.toLowerCase()] || '#999999';
  };

  // Get label color
  const getLabelColor = (labelName: string) => {
    const label = labels.find(l => l.name === labelName);
    return label?.color || '#999999';
  };

  if (!note) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={handleClose}
      />

      {/* Editor Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-[600px] bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="border-b border-[#E8E8E8] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {getLastSavedText()}
            </span>
            {note.syncStatus !== 'synced' && (
              <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                {note.syncStatus}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete note"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleClose}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close editor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Images Gallery */}
          {images.length > 0 && (
            <div className="px-6 pt-6">
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500 font-medium">
                  {images.length} {images.length === 1 ? 'Image' : 'Images'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {images.map((img) => (
                  <div key={img.uuid} className="relative group">
                    <img
                      src={img.localPath}
                      alt={img.fileName}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs text-white truncate">{img.fileName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Start typing... Use #folders and !labels to organize"
            className="w-full h-full p-6 bg-transparent text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none resize-none leading-relaxed"
            autoFocus
          />
        </div>

        {/* Folders and Labels footer */}
        {(currentFolders.length > 0 || currentLabels.length > 0) && (
          <div className="border-t border-[#E8E8E8] px-6 py-4 space-y-3">
            {/* Folders */}
            {currentFolders.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500">Folders:</span>
                {currentFolders.map(folderName => (
                  <span
                    key={folderName}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                    style={{
                      backgroundColor: `${getFolderColor(folderName)}15`,
                      color: getFolderColor(folderName)
                    }}
                  >
                    #{folderName}
                  </span>
                ))}
              </div>
            )}

            {/* Labels */}
            {currentLabels.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500">Labels:</span>
                {currentLabels.map(labelName => (
                  <span
                    key={labelName}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                    style={{
                      backgroundColor: `${getLabelColor(labelName)}15`,
                      color: getLabelColor(labelName)
                    }}
                  >
                    !{labelName}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
