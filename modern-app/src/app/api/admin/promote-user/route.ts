// src/app/api/admin/promote-user/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { userService } from "@/lib/services/user-service";
import { isAdmin } from "@/lib/auth/roles";
import { requireSession } from "@/lib/auth/require-session";
import { logger } from "@/lib/logger";

const promoteUserSchema = z.object({
  userId: z.string().min(1, "User ID is required")
});

export async function POST(request: NextRequest) {
  logger.info("[admin/promote-user] API called");

  try {
    const session = await requireSession();
    if (!isAdmin(session.user.role)) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { userId } = promoteUserSchema.parse(body);

    const targetUser = await userService.getUserById(userId);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.role === "admin") {
      return NextResponse.json({ error: "User is already an admin" }, { status: 400 });
    }

    logger.info("[admin/promote-user] Promoting user", {
      userId,
      email: targetUser.email
    });

    const updatedUser = await userService.promoteToAdmin(userId);

    if (!updatedUser) {
      return NextResponse.json({ error: "Failed to promote user" }, { status: 500 });
    }

    logger.info("[admin/promote-user] Promotion successful", {
      userId,
      email: targetUser.email
    });

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.email} has been promoted to admin`,
      user: updatedUser
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      const issue =
        err.issues?.[0] ||
        // Fallback for any non-standard error shape that might still sneak in
        (err as { errors?: { message?: string }[] }).errors?.[0];

      return NextResponse.json({ error: issue?.message ?? "Invalid request data" }, { status: 400 });
    }

    return logger.apiError("admin/promote-user", err);
  }
}
