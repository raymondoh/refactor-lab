// src/lib/featureFlags.ts
export function isRegistrationEnabled(): boolean {
  const raw = process.env.REGISTRATION_ENABLED;

  // Default to true if not set (safe for local/dev)
  if (raw === undefined) return true;

  return raw === "true";
}
