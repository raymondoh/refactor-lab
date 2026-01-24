import type { Job, JobUrgency } from "./job";
import type { JobServiceType } from "@/lib/config/locations";

export interface SearchFilters {
  query?: string;
  location?: string;
  radius?: number; // in miles
  skills?: string[];
  urgency?: JobUrgency[];
  minBudget?: number;
  maxBudget?: number;
  serviceType?: JobServiceType | null;
  serviceTypes?: JobServiceType[] | null;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: "relevance" | "urgency" | "newest" | "budget_high" | "budget_low" | "distance";
  page?: number;
  limit?: number;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export interface JobSearchResult extends Job {
  relevanceScore?: number;
  distance?: number;
  matchingSkills?: string[];
}

export interface SearchSuggestion {
  type: "location" | "skill";
  value: string;
  count?: number;
}

export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  filters: SearchFilters;
  emailNotifications: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Common skills/specialties for filtering
export const PLUMBING_SKILLS = [
  "Emergency Repairs",
  "Boiler Installation",
  "Boiler Repair",
  "Central Heating",
  "Bathroom Installation",
  "Leak Repairs",
  "Pipe Installation",
  "Drain Cleaning",
  "Water Heater",
  "Radiator Repair",
  "Toilet Installation",
  "Tap Repair",
  "Shower Installation",
  "Gas Safety",
  "Power Flushing"
] as const;

export type PlumbingSkill = (typeof PLUMBING_SKILLS)[number];
