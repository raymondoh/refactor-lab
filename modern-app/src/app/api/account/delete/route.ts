// src/app/api/account/delete/route.ts
import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/require-session";
import { userService } from "@/lib/services/user-service";
import { logger } from "@/lib/logger";

export async function DELETE() {
  try {
    const session = await requireSession();
    const userId = session.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await userService.deleteUserAccount(userId);

    if (!result.success) {
      return NextResponse.json({ error: result.error ?? "Failed to delete account" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully."
    });
  } catch (err: unknown) {
    return logger.apiError("account/delete", err);
  }
}
