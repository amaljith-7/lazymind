// Note parsing utilities for folders (#hashtags) and labels (!exclamations)
import type { ParsedNote, Folder, Label } from '@/types';
import { db } from './db';

/**
 * Parse note input to extract folders, labels, and clean text
 * Folders: #single_word (like #project, #todo, #work)
 * Labels: !phrase until double space or newline (like !book collection, !important)
 */
export const parseNoteInput = (content: string): ParsedNote => {
  // Extract folders: #single_word (alphanumeric and underscores only)
  const folderRegex = /(?:^|\s)#([a-z0-9_]+)/gi;
  const folders = Array.from(content.matchAll(folderRegex))
    .map(m => m[1].toLowerCase())
    .filter((v, i, a) => a.indexOf(v) === i); // deduplicate

  // Extract labels: !phrase until double space or newline
  // Pattern: ! followed by text until we hit double space, newline, or end of string
  const labelRegex = /!([^\n]+?)(?=\s\s|\n|$)/g;
  const labels = Array.from(content.matchAll(labelRegex))
    .map(m => m[1].trim())
    .filter((v, i, a) => a.indexOf(v) === i); // deduplicate

  // Check if this is a todo (has #todo folder)
  const isTodo = folders.some(f => f === 'todo');

  // Clean text: remove folder and label markers
  let cleanText = content
    .replace(folderRegex, '') // remove #folders
    .replace(labelRegex, '') // remove !labels
    .replace(/\s+/g, ' ') // normalize whitespace
    .trim();

  return {
    text: cleanText,
    folders: folders.length > 0 ? folders : ['scratchpad'], // Default to scratchpad
    labels,
    isTodo,
  };
};

/**
 * Auto-suggest folders while typing
 * Returns folders that start with the query string
 */
export const suggestFolders = async (query: string): Promise<Folder[]> => {
  if (!query) return [];
  const lowerQuery = query.toLowerCase();

  const allFolders = await db.folders.toArray();
  return allFolders
    .filter(f => f.name.toLowerCase().startsWith(lowerQuery))
    .sort((a, b) => b.noteCount - a.noteCount) // Sort by usage
    .slice(0, 5); // Limit to top 5 suggestions
};

/**
 * Auto-suggest labels while typing
 * Returns labels that start with the query string
 */
export const suggestLabels = async (query: string): Promise<Label[]> => {
  if (!query) return [];
  const lowerQuery = query.toLowerCase();

  const allLabels = await db.labels.toArray();
  return allLabels
    .filter(l => l.name.toLowerCase().startsWith(lowerQuery))
    .sort((a, b) => b.noteCount - a.noteCount) // Sort by usage
    .slice(0, 5); // Limit to top 5 suggestions
};

/**
 * Generate UUID v4
 * Used for note and image identifiers
 */
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Normalize folder name (lowercase, no spaces)
 */
export const normalizeFolderName = (name: string): string => {
  return name.toLowerCase().trim().replace(/\s+/g, '_');
};

/**
 * Normalize label name (trim whitespace, preserve case)
 */
export const normalizeLabelName = (name: string): string => {
  return name.trim().replace(/\s+/g, ' ');
};

/**
 * Validate folder name format
 * Must be alphanumeric with underscores, no spaces
 */
export const isValidFolderName = (name: string): boolean => {
  if (!name || name.length === 0) return false;
  const validFormat = /^[a-z0-9_]+$/;
  return validFormat.test(name.toLowerCase());
};

/**
 * Extract all folders from content
 */
export const extractFolders = (content: string): string[] => {
  const folderRegex = /(?:^|\s)#([a-z0-9_]+)/gi;
  const folders = Array.from(content.matchAll(folderRegex))
    .map(m => m[1].toLowerCase())
    .filter((v, i, a) => a.indexOf(v) === i);

  return folders.length > 0 ? folders : ['scratchpad'];
};

/**
 * Extract all labels from content
 */
export const extractLabels = (content: string): string[] => {
  const labelRegex = /!([^\n]+?)(?=\s\s|\n|$)/g;
  return Array.from(content.matchAll(labelRegex))
    .map(m => m[1].trim())
    .filter((v, i, a) => a.indexOf(v) === i);
};

/**
 * Check if note content indicates it's a todo
 */
export const isTodoNote = (content: string): boolean => {
  const folders = extractFolders(content);
  return folders.includes('todo');
};

/**
 * Generate random color for new labels
 */
export const generateRandomColor = (): string => {
  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Orange
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#85C1E2', // Light Blue
    '#F8B88B', // Peach
    '#AAB7B8', // Gray
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};
