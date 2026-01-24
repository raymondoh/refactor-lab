// src/lib/utils/format-city-slug.ts

/**
 * Converts a URL slug back into a display-friendly, title-cased string.
 * e.g., "new-york" -> "New York"
 * e.g., "boiler-repair" -> "Boiler Repair"
 * @param slug The input slug string.
 * @returns A formatted string for display in the UI.
 */
export function formatCitySlug(slug: string): string {
  if (!slug) return "";

  return slug
    .replace(/-/g, " ") // Replace hyphens with spaces
    .replace(/\b\w/g, char => char.toUpperCase()); // Capitalize the first letter of each word
}
