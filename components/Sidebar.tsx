'use client';

import { useStore, selectFolders, selectLabels } from '@/lib/store';
import { ChevronDown, Columns2, Hash, Tag } from 'lucide-react';

export function Sidebar() {
  const folders = useStore(selectFolders);
  const labels = useStore(selectLabels);
  const notes = useStore(state => state.notes);
  const selectedFolder = useStore(state => state.selectedFolder);
  const selectedLabel = useStore(state => state.selectedLabel);
  const setSelectedFolder = useStore(state => state.setSelectedFolder);
  const setSelectedLabel = useStore(state => state.setSelectedLabel);
  const clearFilters = useStore(state => state.clearFilters);

  // Predefined folder colors matching the design
  const folderColors: Record<string, string> = {
    'scratchpad': '#DA6969',
    'todo': '#7992E6',
    'movies': '#D366E4',
    'books': '#D7AF57',
    'thoughts': '#DF9372',
    'work': '#6BC4A6',
    'personal': '#E89C7B',
  };

  // Get color for a folder
  const getFolderColor = (folderName: string) => {
    return folderColors[folderName.toLowerCase()] || '#999999';
  };

  // Get total notes count
  const totalNotesCount = notes.length;

  return (
    <div className="w-[232px] h-screen bg-[#F5F5F7] border-r border-[#E7E7E7] flex flex-col overflow-y-auto">
      {/* My Brain Section */}
      <div className="px-5 pt-9">
        <h2 className="text-[15px] font-medium text-black mb-[17px]">
          My Brain
        </h2>

        {/* All Notes button */}
        <button
          onClick={() => clearFilters()}
          className={`w-full text-left text-[15px] mb-[17px] transition-opacity hover:opacity-70 ${
            !selectedFolder && !selectedLabel ? 'font-medium' : 'font-normal'
          }`}
          style={{ color: '#000000' }}
        >
          All Notes ({totalNotesCount})
        </button>

        {/* Folders Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Hash className="w-3 h-3 text-gray-500" />
            <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Folders</h3>
          </div>
          <div className="flex flex-col gap-[17px]">
            {folders.map(folder => {
              const isSelected = selectedFolder === folder.name;
              const color = getFolderColor(folder.name);

              return (
                <button
                  key={folder.name}
                  onClick={() => setSelectedFolder(folder.name)}
                  className={`text-left text-[15px] transition-opacity hover:opacity-70 flex items-center justify-between ${
                    isSelected ? 'font-medium' : 'font-normal'
                  }`}
                  style={{ color }}
                >
                  <span>#{folder.name}</span>
                  <span className="text-xs opacity-60">{folder.noteCount}</span>
                </button>
              );
            })}
          </div>

          {/* Empty state for folders */}
          {folders.length === 0 && (
            <p className="text-xs text-gray-500 mt-2">
              No folders yet. Add #folder to your notes!
            </p>
          )}
        </div>

        {/* Labels Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-3 h-3 text-gray-500" />
            <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Labels</h3>
          </div>
          <div className="flex flex-col gap-[17px]">
            {labels.map(label => {
              const isSelected = selectedLabel === label.name;
              const color = label.color || '#999999';

              return (
                <button
                  key={label.name}
                  onClick={() => setSelectedLabel(label.name)}
                  className={`text-left text-[15px] transition-opacity hover:opacity-70 flex items-center justify-between ${
                    isSelected ? 'font-medium' : 'font-normal'
                  }`}
                  style={{ color }}
                >
                  <span>!{label.name}</span>
                  <span className="text-xs opacity-60">{label.noteCount}</span>
                </button>
              );
            })}
          </div>

          {/* Empty state for labels */}
          {labels.length === 0 && (
            <p className="text-xs text-gray-500 mt-2">
              No labels yet. Add !label to your notes!
            </p>
          )}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User Profile Section */}
      <div className="px-5 pb-[34px] flex items-center gap-3">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-linear-to-br from-gray-300 to-gray-400" />
        
        {/* Name */}
        <span className="text-[14px] text-black">Samad</span>
        
        {/* Dropdown icon */}
        <ChevronDown className="w-[10px] h-[10px] text-gray-600 -rotate-90" />
        
        {/* Spacer */}
        <div className="flex-1" />
        
        {/* Columns icon */}
        <button className="w-6 h-6 flex items-center justify-center">
          <Columns2 className="w-[18px] h-[18px] text-black" />
        </button>
      </div>
    </div>
  );
}
