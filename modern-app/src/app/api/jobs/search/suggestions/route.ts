// src/app/api/jobs/search/suggestions/route.ts
import { requireSession } from "@/lib/auth/require-session";
import { NextRequest, NextResponse } from "next/server";
import { canAccess, SERVICE_ROLES } from "@/lib/auth/roles";

import { z } from "zod";

import { jobService } from "@/lib/services/job-service";
import type { SearchSuggestion } from "@/lib/types/job";

import { logger } from "@/lib/logger";

const suggestionQuerySchema = z.object({
  q: z.string().min(2, "Query must be at least 2 characters"),
  limit: z.coerce.number().int().positive().optional().default(5)
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();

    // This role gate is critical to prevent customers from seeing job data.
    if (!canAccess(session.user.role, SERVICE_ROLES)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const { q, limit } = suggestionQuerySchema.parse(Object.fromEntries(searchParams));

    const jobs = await jobService.getJobsForSuggestions(limit);
    const suggestions: SearchSuggestion[] = [];

    const queryLower = q.toLowerCase();

    // Job title suggestions
    for (const job of jobs) {
      if (job.title.toLowerCase().includes(queryLower)) {
        suggestions.push({
          type: "job",
          value: job.title,
          label: job.title,
          count: 1
        });
      }
    }

    // Skill suggestions based on service types
    const serviceTypes = Array.from(new Set(jobs.filter(j => j.serviceType).map(j => j.serviceType!)));
    for (const serviceType of serviceTypes) {
      if (serviceType.toLowerCase().includes(queryLower)) {
        suggestions.push({
          type: "skill",
          value: serviceType,
          label: serviceType,
          count: jobs.filter(j => j.serviceType === serviceType).length
        });
      }
    }

    // Location suggestions
    const locations = Array.from(new Set(jobs.map(j => j.location.postcode)));
    for (const location of locations) {
      if (location.toLowerCase().includes(queryLower)) {
        suggestions.push({
          type: "location",
          value: location,
          label: location,
          count: jobs.filter(j => j.location.postcode === location).length
        });
      }
    }

    // De-dupe and limit
    const uniqueSuggestions = suggestions
      .filter((s, i, arr) => i === arr.findIndex(t => t.value === s.value && t.type === s.type))
      .slice(0, limit);

    return NextResponse.json({ suggestions: uniqueSuggestions });
  } catch (err: unknown) {
    logger.error("[jobs/search/suggestions] Suggestions API error", err);

    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Invalid query" }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 });
  }
}
