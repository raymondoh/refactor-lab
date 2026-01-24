// src/app/api/jobs/save/route.ts
import { requireSession } from "@/lib/auth/require-session";
import { type NextRequest, NextResponse } from "next/server";
import { canAccess, SERVICE_ROLES, type UserRole } from "@/lib/auth/roles";
import { z } from "zod";
import { requireTier } from "@/lib/auth/require-tier";
import { getSavedJobIdsForUser, removeSavedJobForUser, saveJobForUser } from "@/lib/services/saved-jobs-service";
import { logger } from "@/lib/logger";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

const bodySchema = z.object({ jobId: z.string().min(1, "Job ID is required") });

/**
 * Ensure the user is Pro or Business tier using the centralized requireTier helper.
 * Returns a NextResponse if blocked, or null if allowed.
 */
async function ensureProOrBusiness() {
  try {
    // Pro OR Business can use saved jobs
    await requireTier(["pro", "business"]);
    return null;
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN_TIER") {
      return NextResponse.json(
        { message: "Saving jobs is a Pro feature. Please upgrade." },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }
    // Any other error should bubble up to the route handler
    throw err;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();

    if (!canAccess(session.user.role, SERVICE_ROLES)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403, headers: NO_STORE_HEADERS });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: parsed.error.issues[0]?.message ?? "Invalid body",
          errors: parsed.error.issues
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const tierErr = await ensureProOrBusiness();
    if (tierErr) return tierErr;

    const { jobId } = parsed.data;
    const userId = session.user.id;

    await saveJobForUser(userId, jobId, session.user.role as UserRole);

    return NextResponse.json({ message: "Job saved successfully" }, { headers: NO_STORE_HEADERS });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: err.issues[0]?.message ?? "Invalid body",
          errors: err.issues
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    logger.error("[jobs/save] Error saving job", err);

    return NextResponse.json({ message: "Failed to save job" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireSession();

    if (!canAccess(session.user.role, SERVICE_ROLES)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403, headers: NO_STORE_HEADERS });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: parsed.error.issues[0]?.message ?? "Invalid body",
          errors: parsed.error.issues
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const tierErr = await ensureProOrBusiness();
    if (tierErr) return tierErr;

    const { jobId } = parsed.data;
    const userId = session.user.id;

    await removeSavedJobForUser(userId, jobId);

    return NextResponse.json({ message: "Saved job removed successfully" }, { headers: NO_STORE_HEADERS });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: err.issues[0]?.message ?? "Invalid body",
          errors: err.issues
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    logger.error("[jobs/save] Error removing saved job", err);

    return NextResponse.json({ message: "Failed to remove saved job" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

export async function GET() {
  try {
    const session = await requireSession();

    if (!canAccess(session.user.role, SERVICE_ROLES)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403, headers: NO_STORE_HEADERS });
    }

    const tierErr = await ensureProOrBusiness();
    if (tierErr) return tierErr;

    const userId = session.user.id;
    const savedJobIds = await getSavedJobIdsForUser(userId);

    return NextResponse.json({ savedJobs: savedJobIds }, { headers: NO_STORE_HEADERS });
  } catch (err: unknown) {
    logger.error("[jobs/save] Error getting saved jobs", err);

    return NextResponse.json({ message: "Failed to get saved jobs" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
