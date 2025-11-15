// Hashtag parsing and normalization utilities
import type { TagHierarchy } from '@/types';

/**
 * Extract hashtags from note content
 * Matches pattern: #tag or #tag/subtag or #tag/subtag/deeper
 * Returns normalized (lowercase) tag names
 */
export function extractTags(content: string): string[] {
  // Regex matches hashtags with optional hierarchical structure
  // Pattern: word boundary or start, then #, then alphanumeric/underscore with optional slashes
  const hashtagRegex = /(?:^|\s)#([a-zA-Z0-9_]+(?:\/[a-zA-Z0-9_]+)*)/g;

  const matches: string[] = [];
  let match;

  while ((match = hashtagRegex.exec(content)) !== null) {
    matches.push(match[1]); // capture group 1 is the tag without the #
  }

  // Normalize and deduplicate
  return normalizeTags(matches);
}

/**
 * Normalize tags: lowercase, deduplicate, validate format
 */
export function normalizeTags(tags: string[]): string[] {
  const normalized = tags
    .map(tag => tag.toLowerCase().trim())
    .filter(tag => isValidTag(tag));

  // Deduplicate using Set
  return Array.from(new Set(normalized));
}

/**
 * Validate tag format
 * Must contain only alphanumeric, underscores, and slashes
 * Cannot start or end with a slash
 */
export function isValidTag(tag: string): boolean {
  if (!tag || tag.length === 0) return false;
  if (tag.startsWith('/') || tag.endsWith('/')) return false;
  if (tag.includes('//')) return false; // no double slashes

  // Check format: alphanumeric, underscores, and slashes only
  const validFormat = /^[a-z0-9_]+(?:\/[a-z0-9_]+)*$/;
  return validFormat.test(tag);
}

/**
 * Parse tag hierarchy
 * Input: "project/website/design"
 * Output: { root: "project", full: "project/website/design", parts: ["project", "website", "design"] }
 */
export function parseTagHierarchy(tag: string): TagHierarchy {
  const parts = tag.split('/');
  return {
    root: parts[0],
    full: tag,
    parts
  };
}

/**
 * Get parent tag from a hierarchical tag
 * Input: "project/website/design"
 * Output: "project/website"
 * Returns null if tag has no parent
 */
export function getParentTag(tag: string): string | null {
  const parts = tag.split('/');
  if (parts.length <= 1) return null;

  return parts.slice(0, -1).join('/');
}

/**
 * Get all ancestor tags for a given tag
 * Input: "project/website/design"
 * Output: ["project", "project/website"]
 */
export function getAncestorTags(tag: string): string[] {
  const parts = tag.split('/');
  const ancestors: string[] = [];

  for (let i = 1; i < parts.length; i++) {
    ancestors.push(parts.slice(0, i).join('/'));
  }

  return ancestors;
}

/**
 * Check if a tag is a child of another tag
 * Input: childTag="project/website", parentTag="project"
 * Output: true
 */
export function isChildOf(childTag: string, parentTag: string): boolean {
  if (childTag === parentTag) return false;
  return childTag.startsWith(parentTag + '/');
}

/**
 * Get the depth of a tag (number of levels)
 * Input: "project/website/design"
 * Output: 3
 */
export function getTagDepth(tag: string): number {
  return tag.split('/').length;
}

/**
 * Create hierarchy string for storage
 * Input: "project/website"
 * Output: "project.website"
 */
export function createHierarchyString(tag: string): string {
  return tag.replace(/\//g, '.');
}

/**
 * Get display name from tag (capitalize each part)
 * Input: "project/website"
 * Output: "Project/Website"
 */
export function getDisplayName(tag: string): string {
  return tag
    .split('/')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('/');
}

/**
 * Find all tags matching a search query
 * Performs case-insensitive substring matching
 */
export function searchTags(query: string, allTags: string[]): string[] {
  const lowerQuery = query.toLowerCase();
  return allTags.filter(tag => tag.includes(lowerQuery));
}

/**
 * Sort tags by hierarchy (parents before children, alphabetically within same level)
 */
export function sortTagsHierarchically(tags: string[]): string[] {
  return tags.sort((a, b) => {
    const depthA = getTagDepth(a);
    const depthB = getTagDepth(b);

    // Same depth: alphabetical order
    if (depthA === depthB) {
      return a.localeCompare(b);
    }

    // Different depth: shallower first
    return depthA - depthB;
  });
}

/**
 * Group tags by their root (first level)
 * Input: ["project/website", "project/mobile", "status/done"]
 * Output: { project: ["project/website", "project/mobile"], status: ["status/done"] }
 */
export function groupTagsByRoot(tags: string[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};

  tags.forEach(tag => {
    const { root } = parseTagHierarchy(tag);
    if (!grouped[root]) {
      grouped[root] = [];
    }
    grouped[root].push(tag);
  });

  return grouped;
}
