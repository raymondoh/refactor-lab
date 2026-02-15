// src/app/api/ratings/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

import { adminRatingService } from "@/lib/services/admin-rating-service";
import { auth } from "@/auth";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

const submitRatingSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().optional(),
  title: z.string().optional()
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
    }

    const body = await req.json().catch(() => null);
    const parsed = submitRatingSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues?.[0]?.message ?? "Invalid request";
      return NextResponse.json({ success: false, error: message }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const { productId, rating, comment, title } = parsed.data;

    const result = await adminRatingService.upsertReviewAndRecomputeProductAggregates({
      productId,
      userId: session.user.id,
      rating,
      comment,
      title
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status ?? 500, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json({ success: true, data: result.data }, { headers: NO_STORE_HEADERS });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to submit rating" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
