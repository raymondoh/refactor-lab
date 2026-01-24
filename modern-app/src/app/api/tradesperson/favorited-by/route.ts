// src/app/api/tradesperson/favorited-by/route.ts
import { NextResponse } from "next/server";
import { requireSubscription } from "@/lib/auth/guards";
import { userService } from "@/lib/services/user-service";
import { logger } from "@/lib/logger";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

function isRedirectError(err: unknown): boolean {
  if (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    typeof (err as { digest: unknown }).digest === "string"
  ) {
    return (err as { digest: string }).digest.startsWith("NEXT_REDIRECT");
  }
  return false;
}

export async function GET() {
  try {
    const { session } = await requireSubscription("business", { allowAdminBypass: false });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE_HEADERS });
    }

    if (session.user.role !== "tradesperson") {
      return NextResponse.json(
        { error: "Access denied. This feature is for Business tier tradespeople only." },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const customers = await userService.getCustomersWhoFavorited(session.user.id);

    const publicCustomerData = customers.map(customer => ({
      id: customer.id,
      name: customer.name,
      location: customer.location?.town || customer.location?.postcode || null,
      memberSince: customer.createdAt
    }));

    return NextResponse.json({ customers: publicCustomerData }, { headers: NO_STORE_HEADERS });
  } catch (err: unknown) {
    logger.error("API /tradesperson/favorited-by error:", err);

    if (isRedirectError(err) || (err instanceof Error && err.message.includes("FORBIDDEN_TIER"))) {
      return NextResponse.json(
        { error: "Access denied. This feature is for Business tier subscribers only." },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const message = err instanceof Error ? err.message : "An unexpected error occurred.";

    return NextResponse.json({ error: message }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
