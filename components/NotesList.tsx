'use client';

import { useState } from 'react';
import { useStore, selectNotes, selectFolders, selectLabels } from '@/lib/store';
import { NotepadText, Image as ImageIcon, AudioLines, CheckCircle2, Circle } from 'lucide-react';
import type { Note } from '@/types';

export function NotesList() {
  const notes = useStore(selectNotes);
  const folders = useStore(selectFolders);
  const labels = useStore(selectLabels);
  const selectedNoteUuid = useStore(state => state.selectedNoteUuid);
  const selectedFolder = useStore(state => state.selectedFolder);
  const selectedLabel = useStore(state => state.selectedLabel);
  const setSelectedNote = useStore(state => state.setSelectedNote);
  const toggleTodoCompletion = useStore(state => state.toggleTodoCompletion);

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Get the display name for the current view
  const getViewTitle = () => {
    if (selectedFolder) return `#${selectedFolder}`;
    if (selectedLabel) return `!${selectedLabel}`;
    return 'All Notes';
  };

  // Get note title (first line or first 100 chars)
  const getNoteTitle = (note: Note) => {
    const lines = note.content.split('\n').filter(l => l.trim());
    if (lines.length === 0) return 'Untitled';

    const firstLine = lines[0];
    return firstLine.length > 50 ? firstLine.slice(0, 50) + '...' : firstLine;
  };

  // Format date for display - using simple date formatting
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time to start of day for comparison
    const resetTime = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dateOnly = resetTime(date);
    const todayOnly = resetTime(today);
    const yesterdayOnly = resetTime(yesterday);

    if (dateOnly.getTime() === todayOnly.getTime()) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return 'Yesterday';
    } else if (date.getFullYear() === today.getFullYear()) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
  };

  // Handle todo checkbox click
  const handleTodoToggle = async (e: React.MouseEvent, noteUuid: string) => {
    e.stopPropagation(); // Prevent note selection
    await toggleTodoCompletion(noteUuid);
  };

  // Get folder color
  const getFolderColor = (folderName: string) => {
    const folder = folders.find(f => f.name === folderName);
    // Use predefined colors or default
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

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="px-[101px] pt-10">
        {/* Title */}
        <h1 className="text-[28px] font-medium text-black mb-3">
          {getViewTitle()}
        </h1>

        {/* Divider */}
        <div className="border-t border-[#E8E8E8] mb-[13px]" />

        {/* Controls Row */}
        <div className="flex items-center justify-between mb-[29px]">
          {/* View Toggle */}
          <div className="flex items-center gap-[6px]">
            <button
              onClick={() => setViewMode('list')}
              className={`px-[18px] py-2 rounded-full text-[14px] font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#E8E8E8] text-black'
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-[18px] py-2 rounded-full text-[14px] font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#E8E8E8] text-black'
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              Grid View
            </button>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-3">
            <button className="w-6 h-6 flex items-center justify-center hover:opacity-70 transition-opacity">
              <NotepadText className="w-6 h-6" />
            </button>
            <button className="w-6 h-6 flex items-center justify-center hover:opacity-70 transition-opacity">
              <ImageIcon className="w-6 h-6" />
            </button>
            <button className="w-6 h-6 flex items-center justify-center hover:opacity-70 transition-opacity">
              <AudioLines className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Notes Grid/List */}
        <div className="space-y-[29px] pb-[180px]">
          {notes.length === 0 ? (
            <div className="text-center text-gray-500 py-20">
              No notes found. Start creating notes with #folders and !labels!
            </div>
          ) : (
            notes.map(note => {
              const isSelected = note.uuid === selectedNoteUuid;
              const hasImages = note.imageAttachments && note.imageAttachments.length > 0;

              return (
                <button
                  key={note.uuid}
                  onClick={() => setSelectedNote(note.uuid)}
                  className={`w-full bg-white border border-[#E9E9E9] rounded-[18px] p-[18px] flex flex-col gap-2 text-left transition-all hover:shadow-md ${
                    isSelected ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  {/* Title Row with Todo Checkbox */}
                  <div className="flex items-start gap-3">
                    {/* Todo Checkbox */}
                    {note.isTodo && (
                      <button
                        onClick={(e) => handleTodoToggle(e, note.uuid)}
                        className="flex-shrink-0 mt-0.5 hover:opacity-70 transition-opacity"
                      >
                        {note.isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    )}

                    {/* Note Title */}
                    <h3 className={`text-[15px] font-medium flex-1 ${
                      note.isCompleted ? 'line-through text-gray-400' : 'text-black'
                    }`}>
                      {getNoteTitle(note)}
                    </h3>

                    {/* Image indicator */}
                    {hasImages && (
                      <ImageIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                  </div>

                  {/* Folders, Labels and Date Row */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    {/* Folders and Labels */}
                    <div className="flex items-center gap-3 text-[13px] flex-wrap">
                      {/* Folders */}
                      {note.folders.map(folderName => (
                        <span
                          key={`folder-${folderName}`}
                          style={{ color: getFolderColor(folderName) }}
                        >
                          #{folderName}
                        </span>
                      ))}

                      {/* Labels */}
                      {note.labels.map(labelName => (
                        <span
                          key={`label-${labelName}`}
                          style={{ color: getLabelColor(labelName) }}
                        >
                          !{labelName}
                        </span>
                      ))}
                    </div>

                    {/* Date */}
                    <span className="text-xs text-gray-400 ml-auto">
                      {formatDate(note.updatedAt)}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
