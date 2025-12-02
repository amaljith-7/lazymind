'use client';

import React, { useState, useRef, useEffect, KeyboardEvent, useMemo, ReactElement } from 'react';
import Editor from 'react-simple-code-editor';

interface HighlightedTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  onBlur?: () => void;
  minHeight?: string;
}

export function HighlightedTextarea({
  value,
  onChange,
  onKeyDown,
  placeholder = '',
  className = '',
  autoFocus = false,
  onBlur,
  minHeight = '44px'
}: HighlightedTextareaProps) {
  const [isFocused, setIsFocused] = useState(false);
  // We need a ref to the Editor component to access the internal textarea if needed,
  // but react-simple-code-editor doesn't expose the textarea ref directly easily.
  // However, we can use autoFocus prop.

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
    return '#D366E4';
  };

  // Highlight function for react-simple-code-editor
  const highlight = (code: string) => {
    if (!code) return <br />; // Return br for empty lines to maintain height

    const parts: ReactElement[] = [];
    let lastIndex = 0;
    
    // Regex for tags (including escaped ones)
    const regex = /(#\u200B[a-z0-9_]+)|(!\u200B[^\s]+)|(#([a-z0-9_]+))|(!([^\s]+))/gi;
    let match;
    
    while ((match = regex.exec(code)) !== null) {
      const matchStart = match.index;
      const matchEnd = regex.lastIndex;
      const fullTag = match[0];
      
      // Add text before match
      if (matchStart > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {code.slice(lastIndex, matchStart)}
          </span>
        );
      }
      
      // Check if it's an escaped tag (contains \u200B)
      const isEscaped = fullTag.includes('\u200B');
      
      if (isEscaped) {
        // Escaped tag - render as gray text
        parts.push(
          <span key={`escaped-${matchStart}`} className="text-gray-400">
            {fullTag}
          </span>
        );
      } else {
        // Active tag - render with highlight
        const isFolder = fullTag.startsWith('#');
        const tagName = fullTag.slice(1);
        const color = isFolder ? getFolderColor(tagName) : getLabelColor(tagName);
        
        parts.push(
          <span
            key={`tag-${matchStart}`}
            className="rounded font-medium inline-block"
            style={{
              backgroundColor: `${color}20`,
              color: color,
              padding: '0 2px',
              margin: '0 -2px',
              position: 'relative',
              zIndex: 1
            }}
          >
            {fullTag}
          </span>
        );
      }
      
      lastIndex = matchEnd;
    }
    
    // Add remaining text
    if (lastIndex < code.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {code.slice(lastIndex)}
        </span>
      );
    }
    
    return <>{parts}</>;
  };

  // Handle backspace to toggle tag highlighting
  // Note: react-simple-code-editor passes a standard textarea event
  const handleKeyDown = (e: any) => {
    if (e.key === 'Backspace') {
      const target = e.target as HTMLTextAreaElement;
      const cursorPos = target.selectionStart;
      const textBeforeCursor = value.slice(0, cursorPos);
      const textAfterCursor = value.slice(cursorPos);
      
      // Check if cursor is right after a tag
      // 1. Check for active tag: #tag| -> toggle to #\u200Btag|
      const activeFolderMatch = textBeforeCursor.match(/#([a-z0-9_]+)$/i);
      const activeLabelMatch = textBeforeCursor.match(/!([^\s]+)$/);
      
      const activeMatch = activeFolderMatch || activeLabelMatch;
      
      if (activeMatch) {
        const fullTag = activeMatch[0];
        const marker = fullTag[0];
        const tagName = fullTag.slice(1);
        const newTag = `${marker}\u200B${tagName}`;
        
        const newText = textBeforeCursor.slice(0, -fullTag.length) + newTag + textAfterCursor;
        
        e.preventDefault();
        onChange(newText);
        
        // Move cursor to end of new tag
        // We need to wait for render to update cursor
        setTimeout(() => {
          target.setSelectionRange(cursorPos + 1, cursorPos + 1);
        }, 0);
        return;
      }
      
      // If it's an escaped tag, let backspace delete normally
    }
    
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  return (
    <div className={`relative group ${className}`} style={{ minHeight }}>
      <Editor
        value={value}
        onValueChange={onChange}
        highlight={highlight}
        padding={0}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        autoFocus={autoFocus}
        textareaClassName="focus:outline-none"
        style={{
          fontFamily: 'inherit',
          fontSize: 'inherit',
          lineHeight: 'inherit',
          minHeight: '100%',
        }}
      />
      
      {/* Placeholder (visible only when empty) */}
      {!value && (
        <div 
          className="absolute inset-0 pointer-events-none text-[#B2B2B2]"
          style={{
            fontFamily: 'inherit',
            fontSize: 'inherit',
            lineHeight: 'inherit',
          }}
        >
          {placeholder}
        </div>
      )}
    </div>
  );
}
