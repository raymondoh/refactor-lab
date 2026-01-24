// src/lib/config/locations.ts
import { toSlug } from "@/lib/utils/slugify";

/**
 * A centralized list of cities and services to generate dynamic pages for.
 * This makes it easy to add or remove pages just by updating these arrays.
 */

export const CITIES = [
  "London",
  "Manchester",
  "Birmingham",
  "Leeds",
  "Liverpool",
  "Glasgow",
  "Bristol",
  "Sheffield",
  "Edinburgh",
  "Cardiff",
  "Belfast",
  "Coventry",
  "Nottingham"
];

/**
 * The complete list of all services a tradesperson can select.
 * This is the SINGLE SOURCE OF TRUTH for specialties.
 */
export const ALL_SERVICES = [
  "Boiler Repair & Installation",
  "Leak Detection & Repair",
  "Drain Cleaning & Unblocking",
  "Bathroom Plumbing",
  "Kitchen Plumbing",
  "Gas Services",
  "Central Heating Systems",
  "Water Heater Installation",
  "Emergency Plumber",
  "Tiling",
  "Boiler Installation",
  "Blocked Drains",
  "Water Heater Repair",
  "Toilet Repairs",
  "Tap Installation & Repair",
  "Pipe Repairs",
  "General Plumbing",
  "Radiator Installation & Repair",
  "Sewer Line Services"
];

// High-level service categories used in job forms (serviceType)
export const JOB_SERVICE_TYPES = [
  "Boiler Repair & Installation",
  "Leak Detection & Repair",
  "Drain Cleaning & Unblocking",
  "Bathroom Plumbing",
  "Kitchen Plumbing",
  "Gas Services",
  "Central Heating Systems",
  "Water Heater Installation",
  "General Plumbing",
  "Other"
] as const;

export type JobServiceType = (typeof JOB_SERVICE_TYPES)[number];

/**
 * A curated list of the most popular services.
 * Used for generating footer links and dynamic pages to keep the build focused.
 */
export const POPULAR_SERVICES = [
  "Kitchen Plumbing",
  // FIX: Changed "Boiler Repair" to match the exact database name,
  // ensuring the generated slug is 'boiler-repair-and-installation'.
  "Boiler Repair & Installation",
  "Leak Detection",
  "Drain Cleaning and Unblocking",
  "Bathroom Plumbing",
  "Emergency Plumber"
];

// --- ADDED THIS SECTION ---

// Create a lookup map for slugs -> real names
// We will build this map from ALL_SERVICES to be comprehensive
const serviceSlugMap = new Map<string, string>();
ALL_SERVICES.forEach(service => {
  serviceSlugMap.set(toSlug(service), service);
});
// Also add POPULAR_SERVICES just in case they have a different slug (e.g., "Boiler Repair" vs "Boiler Repair & Installation")
POPULAR_SERVICES.forEach(service => {
  if (!serviceSlugMap.has(toSlug(service))) {
    serviceSlugMap.set(toSlug(service), service);
  }
});

/**
 * Converts a service slug (e.g., "boiler-repair") back to its proper name ("Boiler Repair").
 * Falls back to a title-cased version of the slug if not found.
 */
export function getServiceName(slug: string): string {
  // Try to find the exact slug first
  if (serviceSlugMap.has(slug)) {
    return serviceSlugMap.get(slug)!;
  }

  // If not found, title-case the slug as a fallback
  return slug
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
