// src/app/api/orders/route.ts
import { NextResponse } from "next/server";
import { fetchUserOrders } from "@/actions/orders";
import { auth } from "@/auth";
import { logger } from "@/utils/logger";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // ✅ pass userId and use `data` (not `orders`)
    const result = await fetchUserOrders(session.user.id);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, orders: result.data });
  } catch (error) {
    logger({
      type: "error",
      message: "Error fetching orders from API",
      metadata: { error },
      context: "api-orders"
    });

    return NextResponse.json({ success: false, error: "Failed to fetch orders" }, { status: 500 });
  }
}
