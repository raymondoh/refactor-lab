/**
 * Normalizes Firebase private key formatting issues in environment variables.
 * - Removes accidental wrapping quotes (common in Vercel/copy-paste).
 * - Converts escaped `\n` string literals into real line breaks.
 */
export function normalizePrivateKey(key?: string): string | undefined {
  if (!key) return undefined;

  let cleanKey = key;

  // 1. Remove wrapping double quotes if they exist
  if (cleanKey.startsWith('"') && cleanKey.endsWith('"')) {
    cleanKey = cleanKey.slice(1, -1);
  }

  // 2. Replace escaped newlines with real newlines
  return cleanKey.replace(/\\n/g, "\n");
}
