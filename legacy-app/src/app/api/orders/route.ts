import { NextResponse } from "next/server";
import { fetchUserOrders } from "@/actions/orders";
import { auth } from "@/auth";
import { logger } from "@/utils/logger";

export async function GET() {
  try {
    const session = await auth();

    // It's still good practice to ensure there's a session before calling the action
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // --- THIS IS THE FIX ---
    // Call fetchUserOrders without any arguments.
    // The action itself will get the user ID from the session.
    const { success, orders, error } = await fetchUserOrders();

    if (!success) {
      return NextResponse.json({ success: false, error }, { status: 500 });
    }

    // Return the orders as JSON
    return NextResponse.json({ success: true, orders });
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
