// src/lib/utils/slugify.ts

/**
 * Converts a string into a URL-friendly slug.
 *
 * - Converts to lowercase
 * - Replaces '&' with 'and' for readability
 * - Removes accents and diacritics (e.g., 'é' -> 'e')
 * - Replaces non-alphanumeric characters with a hyphen
 * - Collapses consecutive hyphens into one
 * - Trims hyphens from the start and end
 * - Truncates the result to a maximum length
 *
 * @param input The string to convert.
 * @param maxLength The maximum allowed length for the slug.
 * @returns The generated URL-friendly slug.
 */
export function toSlug(input: string, maxLength = 64): string {
  if (!input) return "";

  return input
    .normalize("NFKD") // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .toLowerCase()
    .replace(/&/g, " and ") // Replace ampersand with ' and '
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric chars with hyphens
    .replace(/-{2,}/g, "-") // Collapse consecutive hyphens
    .replace(/^-+|-+$/g, "") // Trim leading/trailing hyphens
    .slice(0, maxLength); // Enforce max length
}
