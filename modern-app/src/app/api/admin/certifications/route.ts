// src/app/api/admin/certifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/require-session";
import { isAdmin } from "@/lib/auth/roles";
import { userService } from "@/lib/services/user-service";
import type { VerificationResult } from "@/lib/types/certification";
import { logger } from "@/lib/logger";

const querySchema = z.object({
  status: z.enum(["pending", "verified"])
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!isAdmin(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const params = { status: request.nextUrl.searchParams.get("status") };
    const { status } = querySchema.parse(params);

    const users = await userService.getAllUsers();

    interface UserCertification {
      userId: string;
      userName: string;
      certificationId: string;
      certificationName: string;
      issuingBody: string;
      fileUrl: string | null;
      metadata: Record<string, string | null>;
      verified: boolean;
      verification: VerificationResult | null;
      verifiedAt: Date | null;
    }

    const certifications: UserCertification[] = [];

    users.forEach(user => {
      user.certifications?.forEach(cert => {
        const isVerified = !!cert.verified;
        if ((status === "pending" && !isVerified) || (status === "verified" && isVerified)) {
          certifications.push({
            userId: user.id,
            userName: user.name || user.email || "",
            certificationId: cert.id,
            certificationName: cert.name,
            issuingBody: cert.issuingBody,
            fileUrl: cert.fileUrl || null,
            metadata: cert.metadata || {},
            verified: isVerified,
            verification: cert.verification || null,
            verifiedAt: cert.verifiedAt || null
          });
        }
      });
    });

    return NextResponse.json({ certifications });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || "Invalid query" }, { status: 400 });
    }

    return logger.apiError("admin/certifications", err);
  }
}
