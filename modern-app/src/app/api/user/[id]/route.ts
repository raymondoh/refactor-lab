// src/app/api/user/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";

import { userService } from "@/lib/services/user-service";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

const paramsSchema = z.object({
  id: z.string().min(1, "User ID is required")
});

// The context's params object can be a promise in newer Next.js versions.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = paramsSchema.parse(resolvedParams);

    const user = await userService.getUserById(id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404, headers: NO_STORE_HEADERS });
    }

    // Only return public-safe data
    const publicUserData = {
      id: user.id,
      name: user.name,
      businessName: user.businessName,
      googleBusinessProfileUrl: user.googleBusinessProfileUrl
    };

    return NextResponse.json({ user: publicUserData }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid user ID" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    logger.error("[api/user/[id]] User fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
