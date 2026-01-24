// src/app/api/admin/update-user/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { isAdmin } from "@/lib/auth/roles";
import { userService } from "@/lib/services/user-service";
import { requireSession } from "@/lib/auth/require-session";
import { logger } from "@/lib/logger";

const updateSchema = z.object({
  userId: z.string().min(1),
  updates: z.object({}).passthrough()
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!isAdmin(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, updates } = updateSchema.parse(body);

    const updated = await userService.updateUser(userId, updates);
    if (!updated) {
      return NextResponse.json({ error: "Failed to update user" }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || "Invalid data" }, { status: 400 });
    }

    return logger.apiError("admin/update-user", err);
  }
}
