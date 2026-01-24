/**
 * Generates initials from a name string.
 * @param name The full name or business name.
 * @returns A string containing the initials, e.g., "John Smith" -> "JS".
 */
export const getInitials = (name: string | null | undefined): string => {
  if (!name) return "?";

  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase();
};
