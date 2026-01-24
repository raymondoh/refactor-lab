// src/app/api/admin/delete-user/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { isAdmin } from "@/lib/auth/roles";
import { userService } from "@/lib/services/user-service";
import { requireSession } from "@/lib/auth/require-session";
import { logger } from "@/lib/logger";

const schema = z.object({ userId: z.string().min(1) });

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();

    if (!isAdmin(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { userId } = schema.parse(body);

    const success = await userService.deleteUser(userId);
    if (!success) {
      return NextResponse.json({ error: "Failed to delete user" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || "Invalid data" }, { status: 400 });
    }

    return logger.apiError("admin/delete-user", err);
  }
}
