// src/utils/getDisplayName.ts

/**
 * Utility to get a user's display name from available identifiers.
 * Priority: name > email (before @) > fallbackEmail (before @) > "User"
 */

export function getDisplayName(name?: string | null, email?: string | null, fallbackEmail?: string | null): string {
  if (name) return name;
  if (email) return email.split("@")[0];
  if (fallbackEmail) return fallbackEmail.split("@")[0];
  return "User";
}
