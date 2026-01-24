// src/app/api/jobs/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/require-session";
import { canAccess, SERVICE_ROLES } from "@/lib/auth/roles";
import { z } from "zod";
import { jobService } from "@/lib/services/job-service";
import { geocodingService } from "@/lib/services/geocoding-service";
import type { JobUrgency, SearchParams } from "@/lib/types/job";
import { logger } from "@/lib/logger";
import { JOB_SERVICE_TYPES, type JobServiceType } from "@/lib/config/locations";

const POS_INT = z.coerce.number().int().positive();
const NONNEG = z.coerce.number().nonnegative();

// --- FIX: Define Algolia-specific params ---
type AlgoliaSearchParams = SearchParams & {
  serviceType?: JobServiceType;
  aroundLatLng?: string;
  aroundRadius?: number;
  facetFilters?: string[][];
  numericFilters?: (string | string[])[];
};

// Accept single OR multiple OR comma-separated lists (?city=london,manchester&city=leeds)
function readList(sp: URLSearchParams, key: string): string[] {
  const raw = sp.getAll(key);
  const split = raw.flatMap(v => v.split(","));
  return Array.from(new Set(split.map(s => s.trim()).filter(Boolean)));
}

// Wrap requireSession so API callers get 401 instead of NEXT_REDIRECT 500s
async function safeRequireSession() {
  try {
    return await requireSession();
  } catch (e: unknown) {
    if (
      typeof e === "object" &&
      e !== null &&
      "digest" in e &&
      typeof (e as { digest: unknown }).digest === "string" &&
      (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      return null; // unauthenticated
    }
    throw e; // real error
  }
}

const searchQuerySchema = z.object({
  q: z.string().optional(),
  urgency: z.enum(["emergency", "urgent", "soon", "flexible"]).optional(),
  serviceType: z.enum(JOB_SERVICE_TYPES).optional(),
  location: z.string().optional(), // postcode
  radius: POS_INT.optional(), // metres (if your UI sends miles, convert below)
  minBudget: NONNEG.optional(),
  maxBudget: NONNEG.optional(),
  noQuotes: z.coerce.boolean().optional(),
  datePosted: POS_INT.optional(), // days
  page: POS_INT.optional(),
  limit: POS_INT.optional(),
  sortBy: z.enum(["newest", "relevance", "urgency", "budget_high", "budget_low", "distance"]).optional()
});

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.toLowerCase() : "";
}

export async function GET(request: NextRequest) {
  try {
    const session = await safeRequireSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canAccess(session.user.role, SERVICE_ROLES)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const { searchParams } = url;

    // Parse known scalar params with zod
    const parsed = searchQuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues, message: "Invalid query parameters" }, { status: 400 });
    }

    // Multi-value params (arrays / comma-lists)
    const statuses = readList(searchParams, "status");
    const urgencies = readList(searchParams, "urgency");
    const serviceTypes = readList(searchParams, "serviceType");
    const specialties = readList(searchParams, "specialties");
    const cities = readList(searchParams, "city"); // city slugs (e.g., london)

    // Build a SearchParams object (type-safe base)
    const params: AlgoliaSearchParams = {};
    const scalars = parsed.data;

    if (scalars.q) params.query = scalars.q as string;

    // Back-compat single-value fields
    if (scalars.urgency) params.urgency = scalars.urgency as JobUrgency;

    if (scalars.serviceType) {
      // Now typed as JobServiceType
      params.serviceType = scalars.serviceType as JobServiceType; // facet filter downstream
      params.skills = Array.from(new Set([...(params.skills ?? []), scalars.serviceType]));
    }

    if (scalars.sortBy) params.sortBy = scalars.sortBy;
    if (scalars.radius) params.radius = scalars.radius; // metres
    if (scalars.minBudget !== undefined) params.minBudget = scalars.minBudget;
    if (scalars.maxBudget !== undefined) params.maxBudget = scalars.maxBudget;
    if (scalars.noQuotes !== undefined) params.noQuotes = scalars.noQuotes;
    if (scalars.datePosted !== undefined) params.datePosted = scalars.datePosted;
    if (scalars.page !== undefined) params.page = scalars.page;
    if (scalars.limit !== undefined) params.limit = scalars.limit;

    // Geo: postcode → "lat,lng" string for downstream
    if (scalars.location) {
      const coords = await geocodingService.getCoordinatesFromPostcode(scalars.location);
      if (coords) {
        params.location = `${coords.coordinates.latitude},${coords.coordinates.longitude}`;
        params.aroundLatLng = params.location;
      }
    }

    // facetFilters: OR within each group, AND across groups
    const facetFilters: string[][] = [];
    if (statuses.length) facetFilters.push(statuses.map(s => `status:${s}`));
    if (urgencies.length) facetFilters.push(urgencies.map(u => `urgency:${u}`));
    if (serviceTypes.length) facetFilters.push(serviceTypes.map(t => `serviceType:${t}`));
    if (specialties.length) facetFilters.push(specialties.map(sp => `specialties:${sp}`));
    if (cities.length) facetFilters.push(cities.map(c => `citySlug:${c}`));
    if (facetFilters.length) params.facetFilters = facetFilters;

    // numericFilters
    const numericFilters: (string | string[])[] = [];
    if (scalars.minBudget !== undefined) {
      numericFilters.push(`budget>=${scalars.minBudget}`);
    }
    if (scalars.maxBudget !== undefined) {
      numericFilters.push(`budget<=${scalars.maxBudget}`);
    }
    if (scalars.noQuotes) {
      numericFilters.push(`quoteCount=0`);
    }
    if (scalars.datePosted !== undefined) {
      const cutoff = Math.floor(Date.now() - Number(scalars.datePosted) * 24 * 60 * 60 * 1000);
      numericFilters.push(`createdAtTimestamp>=${cutoff}`);
    }
    if (numericFilters.length) {
      params.numericFilters = numericFilters;
    }

    // aroundRadius (optional)
    if (params.aroundLatLng && scalars.radius) {
      params.aroundRadius = scalars.radius; // metres
    }

    // --- Primary: Algolia search ---
    let result = await jobService.searchJobs(params);

    // Decide if any filters/search are active (for hasActiveFilters + fallback)
    const hasAnyFilters = Boolean(
      params.query ||
      params.location ||
      (params.skills && params.skills.length > 0) ||
      params.urgency ||
      params.noQuotes ||
      typeof params.minBudget === "number" ||
      typeof params.maxBudget === "number" ||
      typeof params.datePosted === "number"
    );

    // 🔁 Fallback: if Algolia returns 0 jobs, search Firestore open jobs instead
    if (!result.jobs.length) {
      logger.info("[jobs/search] Algolia returned 0 jobs; falling back to Firestore open-jobs search", {
        hasAnyFilters,
        params
      });

      const allOpenJobs = await jobService.getOpenJobs();

      let filtered = [...allOpenJobs];

      // Simple text search: title, description, postcode, citySlug
      const q = params.query?.toLowerCase().trim();
      if (q) {
        filtered = filtered.filter(job => {
          const title = normalizeString(job.title);
          const description = normalizeString(job.description);

          // --- Handle location as string OR object ---
          let postcode = "";
          const rawLocation = job.location;

          if (typeof rawLocation === "string") {
            postcode = normalizeString(rawLocation);
          } else if (rawLocation && typeof rawLocation === "object") {
            postcode = normalizeString(rawLocation.postcode);
          }

          // --- citySlug may or may not exist on Job ---
          const city = "citySlug" in job ? normalizeString(job.citySlug) : "";

          return title.includes(q) || description.includes(q) || postcode.includes(q) || city.includes(q);
        });
      }

      // Urgency filter
      if (params.urgency) {
        filtered = filtered.filter(job => job.urgency === params.urgency);
      }

      // Budget filters
      if (typeof params.minBudget === "number") {
        filtered = filtered.filter(job => (job.budget ?? 0) >= params.minBudget!);
      }
      if (typeof params.maxBudget === "number") {
        filtered = filtered.filter(job => (job.budget ?? 0) <= params.maxBudget!);
      }

      // No-quotes filter
      if (params.noQuotes) {
        filtered = filtered.filter(job => (job.quoteCount ?? 0) === 0);
      }

      // Date-posted filter (last N days)
      if (typeof params.datePosted === "number" && params.datePosted > 0) {
        const cutoff = Date.now() - params.datePosted * 24 * 60 * 60 * 1000;
        filtered = filtered.filter(job => job.createdAt.getTime() >= cutoff);
      }

      // Sorting
      if (params.sortBy === "budget_high") {
        filtered.sort((a, b) => (b.budget ?? 0) - (a.budget ?? 0));
      } else if (params.sortBy === "budget_low") {
        filtered.sort((a, b) => (a.budget ?? 0) - (b.budget ?? 0));
      } else if (params.sortBy === "urgency") {
        const order: Record<JobUrgency, number> = {
          emergency: 0,
          urgent: 1,
          soon: 2,
          flexible: 3
        };
        filtered.sort(
          (a, b) => order[(a.urgency as JobUrgency) ?? "flexible"] - order[(b.urgency as JobUrgency) ?? "flexible"]
        );
      } else {
        // Default: newest first
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }

      // Pagination
      const page = params.page ?? 1;
      const limit = params.limit ?? 6;
      const totalJobs = filtered.length;
      const totalPages = totalJobs > 0 ? Math.ceil(totalJobs / limit) : 0;
      const start = (page - 1) * limit;
      const pageJobs = filtered.slice(start, start + limit);

      result = {
        jobs: pageJobs,
        pagination: {
          page,
          limit,
          totalJobs,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        filters: {
          ...result.filters,
          sortBy: params.sortBy ?? "newest",
          hasActiveFilters: hasAnyFilters
        },
        stats: {
          totalAvailable: allOpenJobs.length,
          filtered: totalJobs,
          emergencyJobs: filtered.filter(job => job.urgency === "emergency").length,
          avgBudget: totalJobs > 0 ? filtered.reduce((sum, job) => sum + (job.budget ?? 0), 0) / totalJobs : 0
        }
      };
    }

    const serializedJobs = result.jobs.map(job => ({
      ...job,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      scheduledDate: job.scheduledDate?.toISOString(),
      completedDate: job.completedDate?.toISOString()
    }));

    return NextResponse.json({ ...result, jobs: serializedJobs });
  } catch (err: unknown) {
    logger.error("[jobs/search] Error searching jobs", err);

    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Invalid query" }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to search jobs" }, { status: 500 });
  }
}
