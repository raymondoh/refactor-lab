// src/lib/jobs/normalize-specialties.ts

import type { JobServiceType } from "@/lib/config/locations";

/**
 * Lightweight input shape used across create/update flows.
 */
type NormalizeInput = {
  serviceType?: JobServiceType | null;
  specialties?: unknown;
};

function isNormalizeInput(value: unknown): value is NormalizeInput {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    ("serviceType" in value || "specialties" in value)
  );
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every(x => typeof x === "string");
}

/**
 * Slugify a human city/town (or any label) for stable URLs/filters.
 * - trims
 * - lowercases
 * - removes quotes
 * - collapses non-alphanumerics to single '-'
 * - strips leading/trailing '-'
 */
export function toSlug(input?: string | null): string | undefined {
  if (!input) return undefined;
  const s = String(input)
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || undefined;
}

/**
 * Normalize specialties so it always:
 * - is a string array
 * - has no blanks
 * - is de-duplicated (case-insensitive), preserving first-seen casing
 * - includes `serviceType` (if provided) as a specialty
 *
 * Overloads preserved to match existing call sites.
 */
export function normalizeSpecialties(serviceType?: JobServiceType | null, specialties?: unknown): string[];
export function normalizeSpecialties(input: NormalizeInput): string[];
export function normalizeSpecialties(
  input?: JobServiceType | null | NormalizeInput,
  maybeSpecialties?: unknown
): string[] {
  let serviceType: JobServiceType | null | undefined;
  let specialties: unknown;

  if (isNormalizeInput(input)) {
    serviceType = input.serviceType ?? undefined;
    specialties = input.specialties;
  } else {
    serviceType = input ?? undefined;
    specialties = maybeSpecialties;
  }

  const svc = typeof serviceType === "string" ? serviceType.trim() : "";

  // start with a cleaned array of strings
  const base = isStringArray(specialties)
    ? specialties.map(s => (typeof s === "string" ? s.trim() : "")).filter(Boolean)
    : [];

  // case-insensitive de-dupe while preserving first casing
  const seen = new Set<string>(); // store lowercased keys
  const out: string[] = [];
  const pushUnique = (val?: string) => {
    if (!val) return;
    const key = val.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(val);
  };

  // include incoming specialties first (preserves their display casing)
  for (const s of base) pushUnique(s);

  // ensure serviceType is included
  if (svc) pushUnique(svc);

  return out;
}
