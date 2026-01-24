// src/app/api/jobs/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/require-session";
import { jobService } from "@/lib/services/job-service";
import { isAdmin } from "@/lib/auth/roles";
import { normalizeSpecialties, toSlug } from "@/lib/jobs/normalize-specialties";
import type { UpdateJobData } from "@/lib/types/job";
import { logger } from "@/lib/logger";
import { urgencyValues } from "@/lib/schemas/job-form-schema";
import type { JobServiceType } from "@/lib/config/locations";
import { JOB_SERVICE_TYPES } from "@/lib/config/locations";
const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

// Reuse the same style as the create route for scheduled dates
const scheduledDateSchema = z
  .union([
    z
      .string()
      .min(1)
      .transform(val => new Date(val)),
    z.date()
  ])
  .optional()
  .refine(value => !value || !Number.isNaN(value.getTime()), { message: "Invalid scheduled date" });

const updateJobSchema = z.object({
  title: z.string().trim().min(5).optional(),
  description: z.string().trim().min(20).optional(),
  urgency: z.enum(urgencyValues).optional(),
  location: z
    .object({
      postcode: z.string().trim().min(1).optional(), // allow partial updates
      address: z.string().trim().optional(),
      town: z.string().trim().optional()
    })
    .optional(),
  // UI sends number already, so plain number is fine here
  budget: z.number().nonnegative().optional(),
  // Don’t allow an empty string to wipe it out; keep it aligned to known types
  serviceType: z.enum(JOB_SERVICE_TYPES).optional(),
  specialties: z.array(z.string().min(1)).optional(),
  scheduledDate: scheduledDateSchema,
  photos: z.array(z.string().url()).optional()
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();

    const { id } = await params;
    const existing = await jobService.getJobById(id);
    if (!existing) {
      return NextResponse.json({ error: "Job not found" }, { status: 404, headers: NO_STORE_HEADERS });
    }

    const owner = existing.customerId === session.user.id;
    const admin = session.user.role === "admin";
    if (!owner && !admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: NO_STORE_HEADERS });
    }

    const body = await request.json();
    const parsed = updateJobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const patch = parsed.data;

    // latest serviceType based on patch-or-existing
    const nextServiceType = (
      typeof patch.serviceType === "string" ? patch.serviceType : (existing.serviceType as string | undefined)
    ) as JobServiceType | undefined;

    const nextSpecialties = normalizeSpecialties(
      nextServiceType ?? null,
      patch.specialties ?? (Array.isArray(existing.specialties) ? existing.specialties : [])
    );

    // derive citySlug if town provided in this update
    let citySlug: string | undefined;
    const town = patch.location?.town;
    if (town) {
      citySlug = toSlug(town);
    }

    // merge partial location updates with existing
    const nextLocation = patch.location ? { ...existing.location, ...patch.location } : existing.location;

    const updatePayload: UpdateJobData = {
      ...patch,
      location: nextLocation,
      serviceType: nextServiceType,
      specialties: nextSpecialties
    };
    if (citySlug) {
      updatePayload.citySlug = citySlug;
    }

    const updatedJob = await jobService.updateJob(id, updatePayload);
    return NextResponse.json(updatedJob, { headers: NO_STORE_HEADERS });
  } catch (err: unknown) {
    return logger.apiError("jobs/update", err);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    if (!isAdmin(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: NO_STORE_HEADERS });
    }

    const { id: jobId } = await params;
    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400, headers: NO_STORE_HEADERS });
    }

    await jobService.adminDeleteJob(jobId);

    return NextResponse.json(
      {
        success: true,
        message: "Job and all associated data deleted successfully."
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: unknown) {
    logger.error("[jobs/delete] Error deleting job", err);

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
