// src/app/api/jobs/[id]/cancel/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/require-session";
import { jobService } from "@/lib/services/job-service";
import { logger } from "@/lib/logger";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

// Optional reason for auditing/UX
const cancelSchema = z.object({
  reason: z.string().max(500).optional()
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(); // ⛔ server-authoritative auth
    const { id } = await params; // Next 15: params can be a Promise

    const job = await jobService.getJobById(id);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404, headers: NO_STORE_HEADERS });
    }

    // Only the job owner (customer) or an admin can cancel
    const isOwner = job.customerId === session.user.id;
    const isAdmin = session.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: NO_STORE_HEADERS });
    }

    // Already cancelled?
    if (job.status === "cancelled") {
      return NextResponse.json({ error: "Job is already cancelled" }, { status: 409, headers: NO_STORE_HEADERS });
    }

    // Validate body
    const body = await request.json().catch(() => ({}));
    const parsed = cancelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400, headers: NO_STORE_HEADERS });
    }

    // Apply the cancellation
    const { reason } = parsed.data;
    const update: Record<string, unknown> = {
      status: "cancelled",
      cancellationReason: reason || null,
      cancelledAt: new Date(),
      cancelledBy: session.user.id
    };

    const updatedJob = await jobService.updateJob(id, update);

    return NextResponse.json(updatedJob, { headers: NO_STORE_HEADERS });
  } catch (err: unknown) {
    logger.error("[jobs/cancel] Error cancelling job", err);

    return NextResponse.json({ error: "Failed to cancel job" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
