// src/app/api/jobs/my-jobs/route.ts
import { NextResponse } from "next/server";
import { jobService } from "@/lib/services/job-service";
import { requireSession } from "@/lib/auth/require-session";
import { logger } from "@/lib/logger";
import type { Job } from "@/lib/types/job";

// Generic dedupe helper that works with Job[] and similar shapes
type DedupeKeyed = {
  id?: string;
  objectID?: string;
};

function dedupeJobs<T extends DedupeKeyed>(jobs: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const job of jobs) {
    const key = job.id ?? job.objectID;

    // If there's no key, just include it (shouldn't normally happen)
    if (!key) {
      result.push(job);
      continue;
    }

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(job);
  }

  return result;
}

// Fetch jobs for the logged-in customer (or admin viewing their own)
export async function GET() {
  // Important: let requireSession() throw its redirect outside the try/catch
  const session = await requireSession();

  try {
    if (session.user.role !== "customer" && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const jobs = await jobService.getJobsByCustomer(session.user.id);

    // ✅ Remove accidental duplicates safely with proper typing
    const uniqueJobs = dedupeJobs(jobs as (Job & DedupeKeyed)[]);

    return NextResponse.json({ jobs: uniqueJobs });
  } catch (error) {
    logger.error("[jobs] API Error - /api/jobs/my-jobs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
