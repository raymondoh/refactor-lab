// src/app/api/auth/set-role/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/require-session";
import { userService } from "@/lib/services/user-service";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store"
} as const;

const roleSchema = z.object({
  role: z.enum(["customer", "tradesperson"])
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();

    const contentType = request.headers.get("content-type") || "";
    let input: unknown;

    if (contentType.includes("application/json")) {
      // JSON body
      input = await request.json();
    } else {
      // Form-encoded body (e.g. from <form method="POST">)
      const formData = await request.formData();
      input = {
        role: formData.get("role")
      };
    }

    const parsed = roleSchema.safeParse(input);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message ?? "Invalid role" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const { role } = parsed.data;
    const userId = session.user.id;

    logger.info("[/api/auth/set-role] Updating user role", {
      userId,
      newRole: role
    });

    const updatedUser = await userService.updateUser(userId, { role });

    if (!updatedUser) {
      logger.warn("[/api/auth/set-role] User not found when updating role", { userId });
      return NextResponse.json({ error: "User not found" }, { status: 404, headers: NO_STORE_HEADERS });
    }

    // If this was an XHR/fetch JSON request, respond with JSON
    if (contentType.includes("application/json")) {
      return NextResponse.json({ success: true, redirectTo: "/dashboard" }, { status: 200, headers: NO_STORE_HEADERS });
    }

    // Otherwise, do a normal redirect (for form POST)
    return NextResponse.redirect(new URL("/dashboard", request.url), {
      headers: NO_STORE_HEADERS
    });
  } catch (error) {
    logger.error("[/api/auth/set-role] Failed to set role", error);

    return NextResponse.json({ error: "Unable to update role" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
