// src/app/api/favorites/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { userService } from "@/lib/services/user-service";
import { requireSession } from "@/lib/auth/require-session";
import { logger } from "@/lib/logger";
import { serializeFirestore } from "@/lib/utils/serialize-firestore";
import { canAccess, type UserRole } from "@/lib/auth/roles";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

const postSchema = z.object({
  tradespersonId: z.string().min(1, "tradespersonId is required")
});

const deleteQuerySchema = z.object({
  tradespersonId: z.string().min(1, "tradespersonId is required")
});

// Customer-only access for favourites
const CUSTOMER_ONLY = ["customer"] as const satisfies readonly UserRole[];

function ensureCustomer(role: string | undefined) {
  if (!canAccess(role, CUSTOMER_ONLY)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: NO_STORE_HEADERS });
  }
  return null;
}

export async function GET() {
  try {
    const session = await requireSession();

    const forbidden = ensureCustomer(session.user.role);
    if (forbidden) return forbidden;

    const favorites = await userService.getFavoriteTradespeople(session.user.id);

    // 🔥 Serialize because Firestore user objects may contain Timestamps
    const safeFavorites = serializeFirestore(favorites);

    return NextResponse.json({ favorites: safeFavorites }, { headers: NO_STORE_HEADERS });
  } catch (err: unknown) {
    logger.error("[favorites] GET error", err);
    return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();

    const forbidden = ensureCustomer(session.user.role);
    if (forbidden) return forbidden;

    const { tradespersonId } = postSchema.parse(await request.json());

    await userService.addFavoriteTradesperson(session.user.id, tradespersonId);

    return NextResponse.json({ success: true }, { headers: NO_STORE_HEADERS });
  } catch (err: unknown) {
    logger.error("[favorites] POST error", err);

    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Invalid request" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json({ error: "Failed to add favorite" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireSession();

    const forbidden = ensureCustomer(session.user.role);
    if (forbidden) return forbidden;

    const { searchParams } = new URL(request.url);
    const parsed = deleteQuerySchema.parse(Object.fromEntries(searchParams));
    const { tradespersonId } = parsed;

    await userService.removeFavoriteTradesperson(session.user.id, tradespersonId);

    return NextResponse.json({ success: true }, { headers: NO_STORE_HEADERS });
  } catch (err: unknown) {
    logger.error("[favorites] DELETE error", err);

    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Invalid request" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json({ error: "Failed to remove favorite" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
