'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useStore, selectInputMode } from '@/lib/store';
import { ArrowUp, ImagePlus, X } from 'lucide-react';
import { suggestFolders, suggestLabels } from '@/lib/noteParsing';
import { HighlightedTextarea } from '@/components/HighlightedTextarea';
import type { Folder, Label } from '@/types';

export function Editor() {
  const createNote = useStore(state => state.createNote);
  const inputMode = useStore(selectInputMode);
  const setInputMode = useStore(state => state.setInputMode);
  const setSearchQuery = useStore(state => state.setSearchQuery);

  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [folderSuggestions, setFolderSuggestions] = useState<Folder[]>([]);
  const [labelSuggestions, setLabelSuggestions] = useState<Label[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentTyping, setCurrentTyping] = useState<{ type: 'folder' | 'label', query: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle creating a new note
  const handleCreateNote = useCallback(async () => {
    if (!content.trim() && images.length === 0) return;

    await createNote(content, images);
    setContent('');
    setImages([]);
  }, [content, images, createNote]);

  // Handle search mode - update search query as user types
  useEffect(() => {
    if (inputMode === 'search') {
      setSearchQuery(content);
    }
  }, [content, inputMode, setSearchQuery]);

  // Handle auto-suggestions for folders and labels
  useEffect(() => {
    const detectTyping = async () => {
      // For now, disable auto-suggestions with contenteditable
      // Can be enhanced later to detect cursor position in contenteditable
      setShowSuggestions(false);
      setCurrentTyping(null);
    };

    detectTyping();
  }, [content]);

  // Handle suggestion selection
  const selectSuggestion = (suggestion: Folder | Label) => {
    if (!currentTyping) return;

    const cursorPosEstimate = content.length; // Fallback to end
    const textBeforeCursor = content.slice(0, cursorPosEstimate);
    const textAfterCursor = content.slice(cursorPosEstimate);

    let newText = '';
    if (currentTyping.type === 'folder') {
      newText = textBeforeCursor.replace(/#[a-z0-9_]*$/i, `#${suggestion.name} `) + textAfterCursor;
    } else {
      newText = textBeforeCursor.replace(/![^\s]*$/, `!${suggestion.name} `) + textAfterCursor;
    }

    setContent(newText);
    setShowSuggestions(false);
  };

  // Handle image upload
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(prev => [...prev, ...files]);
  };

  // Remove image
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Escape to hide suggestions
    if (e.key === 'Escape' && showSuggestions) {
      e.preventDefault();
      setShowSuggestions(false);
      return;
    }

    // Cmd/Ctrl + Enter to create note (only in input mode)
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && inputMode === 'input') {
      e.preventDefault();
      handleCreateNote();
      return;
    }

    // Plain Enter submits note, Shift+Enter keeps newline
    if (
      e.key === 'Enter' &&
      inputMode === 'input' &&
      !e.shiftKey &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.altKey
    ) {
      e.preventDefault();
      handleCreateNote();
    }
  };

  return (
    <div className="fixed bottom-0 left-[232px] right-0 px-[101px] pb-[36px]">
      {/* Input Box */}
      <div className="relative w-full bg-white border border-[#E8E8E8] rounded-[18px] p-[18px]">
        {/* Suggestions Dropdown */}
        {showSuggestions && currentTyping && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-[#E8E8E8] rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {currentTyping.type === 'folder' && folderSuggestions.map(folder => (
              <button
                key={folder.name}
                onClick={() => selectSuggestion(folder)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between"
              >
                <span>#{folder.name}</span>
                <span className="text-xs text-gray-400">{folder.noteCount} notes</span>
              </button>
            ))}
            {currentTyping.type === 'label' && labelSuggestions.map(label => (
              <button
                key={label.name}
                onClick={() => selectSuggestion(label)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between"
              >
                <span style={{ color: label.color }}>!{label.name}</span>
                <span className="text-xs text-gray-400">{label.noteCount} notes</span>
              </button>
            ))}
          </div>
        )}

        {/* Highlighted Textarea */}
        <HighlightedTextarea
          value={content}
          onChange={setContent}
          onKeyDown={handleKeyDown}
          placeholder={inputMode === 'input' ? "Write freely to empty your mind..." : "Search your notes..."}
          className="w-full text-[15px] text-black placeholder-[#B2B2B2]"
          minHeight="44px"
        />

        {/* Image Previews */}
        {images.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {images.map((img, index) => (
              <div key={index} className="relative group">
                <img
                  src={URL.createObjectURL(img)}
                  alt={`Upload ${index + 1}`}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Mode Toggle & Send Button Container */}
        <div className="flex items-center justify-between mt-[14px]">
          {/* Mode Toggle */}
          <div className="flex items-center gap-3 px-[3px] py-[3px] bg-[#F5F5F7] rounded-lg">
            <button
              onClick={() => setInputMode('input')}
              className={`px-2 py-[3px] text-[12px] rounded-md transition-colors ${
                inputMode === 'input'
                  ? 'bg-white border border-[#E8E8E8] text-black'
                  : 'text-black'
              }`}
            >
              Create
            </button>
            <button
              onClick={() => setInputMode('search')}
              className={`px-2 py-[3px] text-[12px] rounded-md transition-colors ${
                inputMode === 'search'
                  ? 'bg-white border border-[#E8E8E8] text-black'
                  : 'text-black'
              }`}
            >
              Search
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Image Upload Button (only in create mode) */}
            {inputMode === 'input' && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-7 h-7 flex items-center justify-center bg-[#F5F5F7] rounded-full hover:bg-gray-300 transition-colors"
                  title="Upload images"
                >
                  <ImagePlus className="w-4 h-4 text-[#A2A2A2]" />
                </button>
              </>
            )}

            {/* Send Button (only in create mode) */}
            {inputMode === 'input' && (
              <button
                onClick={handleCreateNote}
                disabled={!content.trim() && images.length === 0}
                className="w-7 h-7 flex items-center justify-center bg-[#F5F5F7] rounded-full -rotate-90 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowUp className="w-3 h-3 text-[#A2A2A2]" strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
