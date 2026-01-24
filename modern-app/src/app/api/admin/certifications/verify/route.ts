// src/app/api/admin/certifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/require-session";
import { isAdmin } from "@/lib/auth/roles";
import { userService } from "@/lib/services/user-service";
import type { Certification } from "@/lib/types/certification";
import { logger } from "@/lib/logger";

const verifySchema = z.object({
  userId: z.string().min(1),
  certificationId: z.string().min(1),
  verified: z.boolean()
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (!isAdmin(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, certificationId, verified } = verifySchema.parse(body);

    const user = await userService.getUserById(userId);
    if (!user || !user.certifications) {
      return NextResponse.json({ error: "Certification not found" }, { status: 404 });
    }

    const certIndex = user.certifications.findIndex(c => c.id === certificationId);
    if (certIndex === -1) {
      return NextResponse.json({ error: "Certification not found" }, { status: 404 });
    }

    const now = new Date();
    const updatedCert: Certification = { ...user.certifications[certIndex] };

    updatedCert.verified = verified;
    updatedCert.verifiedAt = now;
    updatedCert.verifiedBy = session.user.id;

    if (verified) {
      // Admin is manually verifying, so create a manual verification record.
      updatedCert.verification = {
        verified: true,
        method: "manual",
        checkedAt: now,
        provider: "admin",
        reference: {
          registrationNumber: updatedCert.metadata?.registrationNumber || null
        }
      };
    } else {
      // If rejecting, clear any previous verification data.
      updatedCert.verification = null;
    }

    const updatedCertifications = [...user.certifications];
    updatedCertifications[certIndex] = updatedCert;

    const updated = await userService.updateUser(userId, {
      certifications: updatedCertifications
    });

    if (!updated) {
      return NextResponse.json({ error: "Failed to update certification" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || "Invalid data" }, { status: 400 });
    }

    return logger.apiError("admin/certifications", err);
  }
}
