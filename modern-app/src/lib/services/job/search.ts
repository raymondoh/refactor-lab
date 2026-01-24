// src/lib/services/job/search.ts
import { searchIndex } from "@/lib/algolia/client";
import { logger } from "@/lib/logger";
import type { Job, JobUrgency, SearchParams, SearchResult } from "@/lib/types/job";
import { CITIES, POPULAR_SERVICES, getServiceName } from "@/lib/config/locations";
import type { JobServiceType } from "@/lib/config/locations";
import { toSlug } from "@/lib/utils/slugify";
import * as JobActions from "./actions";

const JOBS_INDEX = "jobs";

type AlgoliaSearchParams = {
  query: string;
  filters: string;
  page: number;
  hitsPerPage: number;
  numericFilters?: (string | string[])[];
  aroundLatLng?: string;
  aroundRadius?: number;
};

type JobHit = Job & {
  objectID?: string;
  createdAt?: string | number | Date;
  updatedAt?: string | number | Date;
  scheduledDate?: string | number | Date;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toDateSafe(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? new Date(0) : d;
  }
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? new Date(0) : d;
  }
  return new Date(0);
}

function normalize(value: unknown): string {
  return typeof value === "string" ? value.toLowerCase() : "";
}

/**
 * Searches the 'jobs' Algolia index, with a Firestore fallback when Algolia
 * returns 0 jobs and there are no active filters.
 */
export async function searchJobs(params: SearchParams): Promise<SearchResult> {
  const {
    query = "",
    location,
    radius, // miles from UI
    urgency,
    minBudget,
    maxBudget,
    noQuotes,
    datePosted, // days
    skills = [],
    sortBy = "newest",
    page = 1, // UI 1-based
    limit = 6
  } = params as SearchParams & { serviceType?: JobServiceType };

  // ---- Build facet filter expression ----
  const filters: string[] = ["status:open"];

  if (urgency) {
    filters.push(`urgency:"${urgency}"`);
  }

  // Prefer explicit serviceType (exact match) if provided; allow either field to match
  const serviceType = (params as SearchParams & { serviceType?: JobServiceType }).serviceType;

  if (serviceType && serviceType.trim().length > 0) {
    filters.push(`(serviceType:"${serviceType}" OR specialties:"${serviceType}")`);
  } else if (skills.length > 0) {
    // Back-compat: allow matching either serviceType or specialties for each skill
    const orParts: string[] = [];
    for (const s of skills) {
      const name = getServiceName(s);
      orParts.push(`serviceType:"${name}"`);
      orParts.push(`specialties:"${name}"`);
    }
    filters.push(`(${orParts.join(" OR ")})`);
  }

  // ---- Numeric filters ----
  const numericFilters: (string | string[])[] = [];

  if (typeof minBudget === "number") numericFilters.push(`budget>=${minBudget}`);
  if (typeof maxBudget === "number") numericFilters.push(`budget<=${maxBudget}`);

  if (noQuotes) numericFilters.push("quoteCount=0");

  if (typeof datePosted === "number" && datePosted > 0) {
    const sinceMs = Date.now() - datePosted * MS_PER_DAY;
    // Prefer createdAtTimestamp; fallback to createdAt if needed (OR group).
    numericFilters.push([`createdAtTimestamp>=${sinceMs}`, `createdAt>=${sinceMs}`]);
  }

  const searchParams: AlgoliaSearchParams = {
    query,
    filters: filters.join(" AND "),
    page: Math.max(page - 1, 0), // Algolia is 0-based
    hitsPerPage: limit
  };

  if (numericFilters.length > 0) {
    searchParams.numericFilters = numericFilters;
  }

  // ---- Geo (only if valid) ----
  if (location) {
    const [lat, lng] = location.split(",").map(Number);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      searchParams.aroundLatLng = `${lat},${lng}`;
      if (typeof radius === "number") {
        // UI radius is miles → Algolia expects meters
        searchParams.aroundRadius = Math.max(Math.floor(radius * 1609.34), 1);
      }
    }
  }

  // Used to decide if we should try Firestore fallback.
  const hasAnyFilters = Boolean(
    query ||
    location ||
    typeof radius === "number" ||
    urgency ||
    typeof minBudget === "number" ||
    typeof maxBudget === "number" ||
    noQuotes ||
    typeof datePosted === "number" ||
    (skills && skills.length > 0) ||
    serviceType
  );

  try {
    // First search (possibly with geo)
    const response = await searchIndex<Job>({ indexName: JOBS_INDEX, searchParams });

    // Geo fallback: if a geo-constrained query returns 0, retry once without geo filters.
    let finalResponse = response;
    if (searchParams.aroundLatLng && response.nbHits === 0) {
      const { aroundLatLng: _aroundLatLng, aroundRadius: _aroundRadius, ...noGeo } = searchParams;
      const retry = await searchIndex<Job>({ indexName: JOBS_INDEX, searchParams: noGeo });
      finalResponse = retry;
      logger.info("Algolia geo fallback applied (removed aroundLatLng/aroundRadius).");
    }

    // -------------------------------
    // Firestore fallback:
    // If Algolia returns 0 jobs AND there are no active filters,
    // we fall back to Firestore "open jobs".
    // -------------------------------
    if (finalResponse.nbHits === 0 && !hasAnyFilters) {
      logger.info("[jobs/search] Algolia returned 0 jobs; falling back to Firestore open-jobs search", {
        hasAnyFilters,
        params: {
          query,
          urgency,
          minBudget,
          maxBudget,
          noQuotes,
          datePosted,
          skills,
          serviceType,
          page,
          limit
        }
      });

      const openJobs = await JobActions.getOpenJobs(); // already mapped from Firestore

      const filteredJobs = openJobs.filter(job => {
        if (job.status !== "open") return false;

        if (urgency && job.urgency !== urgency) return false;

        if (typeof minBudget === "number" && (job.budget ?? 0) < minBudget) return false;
        if (typeof maxBudget === "number" && (job.budget ?? 0) > maxBudget) return false;

        if (noQuotes && (job.quoteCount ?? 0) !== 0) return false;

        if (typeof datePosted === "number" && datePosted > 0) {
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - datePosted);
          if (toDateSafe(job.createdAt).getTime() < cutoff.getTime()) return false;
        }

        if (query) {
          const q = query.toLowerCase();
          const title = normalize(job.title);
          const description = normalize(job.description);

          const rawLocation = job.location as unknown;
          let locationText = "";

          if (typeof rawLocation === "string") {
            locationText = rawLocation.toLowerCase();
          } else if (rawLocation && typeof rawLocation === "object") {
            const loc = rawLocation as { postcode?: string | null; town?: string | null };
            const postcode = normalize(loc.postcode ?? "");
            const town = normalize(loc.town ?? "");
            locationText = `${postcode} ${town}`.trim();
          }

          const haystack = `${title} ${description} ${locationText}`.trim();
          if (!haystack.includes(q)) return false;
        }

        return true;
      });

      // Sort locally
      if (sortBy === "budget_high") {
        filteredJobs.sort((a, b) => (b.budget ?? 0) - (a.budget ?? 0));
      } else if (sortBy === "budget_low") {
        filteredJobs.sort((a, b) => (a.budget ?? 0) - (b.budget ?? 0));
      } else if (sortBy === "urgency") {
        const order: Record<JobUrgency, number> = { emergency: 0, urgent: 1, soon: 2, flexible: 3 };
        filteredJobs.sort((a, b) => order[a.urgency ?? "flexible"] - order[b.urgency ?? "flexible"]);
      } else {
        // default: newest
        filteredJobs.sort((a, b) => toDateSafe(b.createdAt).getTime() - toDateSafe(a.createdAt).getTime());
      }

      const totalJobs = filteredJobs.length;
      const totalPages = Math.ceil(totalJobs / limit);
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedJobs = filteredJobs.slice(start, end);

      const emergencyJobs = filteredJobs.filter(job => job.urgency === "emergency").length;
      const avgBudget =
        filteredJobs.length > 0
          ? filteredJobs.reduce((sum, job) => sum + (job.budget ?? 0), 0) / filteredJobs.length
          : 0;

      return {
        jobs: paginatedJobs,
        pagination: {
          page,
          limit,
          totalJobs,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        filters: {
          query: query || undefined,
          location,
          radius,
          urgency: urgency ? [urgency] : undefined,
          minBudget,
          maxBudget,
          skills: skills.length > 0 ? skills : undefined,
          serviceType,
          noQuotes,
          datePosted,
          sortBy,
          hasActiveFilters: hasAnyFilters
        },
        stats: {
          totalAvailable: totalJobs,
          filtered: totalJobs,
          emergencyJobs,
          avgBudget
        }
      };
    }

    // -------------------------------
    // Normal Algolia path
    // -------------------------------
    const hits = [...finalResponse.hits];

    // Client-side sorts (optional)
    if (!(sortBy === "distance" && searchParams.aroundLatLng)) {
      if (sortBy === "budget_high") {
        hits.sort((a, b) => (b.budget ?? 0) - (a.budget ?? 0));
      } else if (sortBy === "budget_low") {
        hits.sort((a, b) => (a.budget ?? 0) - (b.budget ?? 0));
      } else if (sortBy === "urgency") {
        const order: Record<JobUrgency, number> = { emergency: 0, urgent: 1, soon: 2, flexible: 3 };
        hits.sort((a, b) => order[a.urgency ?? "flexible"] - order[b.urgency ?? "flexible"]);
      }
    }

    const jobs: Job[] = hits.map(hit => {
      const jobHit = hit as JobHit;

      const fallbackId = jobHit.id ?? jobHit.objectID ?? "";

      return {
        ...jobHit,
        id: fallbackId,
        createdAt: jobHit.createdAt instanceof Date ? jobHit.createdAt : toDateSafe(jobHit.createdAt),
        updatedAt: jobHit.updatedAt instanceof Date ? jobHit.updatedAt : toDateSafe(jobHit.updatedAt),
        scheduledDate:
          jobHit.scheduledDate instanceof Date || jobHit.scheduledDate === undefined
            ? jobHit.scheduledDate
            : toDateSafe(jobHit.scheduledDate)
      };
    });

    const totalJobs = finalResponse.nbHits;
    const totalPages = finalResponse.nbPages;
    const emergencyJobs = jobs.filter(job => job.urgency === "emergency").length;
    const avgBudget = jobs.length > 0 ? jobs.reduce((sum, job) => sum + (job.budget ?? 0), 0) / jobs.length : 0;

    const hasActiveFilters = Boolean(
      query ||
      location ||
      radius ||
      urgency ||
      typeof minBudget === "number" ||
      typeof maxBudget === "number" ||
      skills.length > 0 ||
      serviceType ||
      noQuotes ||
      datePosted ||
      sortBy !== "newest"
    );

    return {
      jobs,
      pagination: {
        page,
        limit,
        totalJobs,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      filters: {
        query: query || undefined,
        location,
        radius,
        urgency: urgency ? [urgency] : undefined,
        minBudget,
        maxBudget,
        skills: skills.length > 0 ? skills : undefined,
        serviceType,
        noQuotes,
        datePosted,
        sortBy,
        hasActiveFilters
      },
      stats: {
        totalAvailable: totalJobs,
        filtered: totalJobs,
        emergencyJobs,
        avgBudget
      }
    };
  } catch (error) {
    logger.error("Algolia: Failed to search jobs:", error);

    const hasActiveFilters = Boolean(
      query ||
      location ||
      radius ||
      urgency ||
      typeof minBudget === "number" ||
      typeof maxBudget === "number" ||
      skills.length > 0 ||
      serviceType ||
      noQuotes ||
      datePosted ||
      sortBy !== "newest"
    );

    return {
      jobs: [],
      pagination: {
        page,
        limit,
        totalJobs: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      },
      filters: {
        query: query || undefined,
        location,
        radius,
        urgency: urgency ? [urgency] : undefined,
        minBudget,
        maxBudget,
        skills: skills.length > 0 ? skills : undefined,
        serviceType,
        noQuotes,
        datePosted,
        sortBy,
        hasActiveFilters
      },
      stats: {
        totalAvailable: 0,
        filtered: 0,
        emergencyJobs: 0,
        avgBudget: 0
      }
    };
  }
}

/**
 * Gets filter data for the job board sidebar (cities, specialties).
 */
export async function getJobFilters() {
  try {
    const response = await searchIndex<Job>({
      indexName: JOBS_INDEX,
      searchParams: {
        query: "",
        facets: ["citySlug", "specialties"],
        hitsPerPage: 0
      }
    });

    const facets = response.facets as Record<string, Record<string, number>> | undefined;
    const citiesFacet = facets?.citySlug ?? {};
    const specialtiesFacet = facets?.specialties ?? {};

    const toArray = (facet: Record<string, number>): string[] =>
      Object.entries(facet)
        .sort(([, a], [, b]) => b - a)
        .map(([name]) => name);

    return {
      cities: toArray(citiesFacet),
      specialties: toArray(specialtiesFacet)
    };
  } catch (error) {
    logger.error("Algolia: Failed to get job filters:", error);
    return { cities: [], specialties: [] };
  }
}

export async function getStaticJobParams(): Promise<{ city: string; service: string }[]> {
  const params: { city: string; service: string }[] = [];
  for (const city of CITIES) {
    for (const service of POPULAR_SERVICES) {
      params.push({ city: toSlug(city), service: toSlug(service) });
    }
  }
  return params;
}
