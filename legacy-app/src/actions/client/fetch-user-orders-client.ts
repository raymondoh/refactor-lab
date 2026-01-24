import type { Order } from "@/types";

/**
 * Client-side action: Fetches the user's orders safely.
 */
export async function fetchUserOrdersClient(): Promise<Order.Order[]> {
  try {
    const res = await fetch("/api/orders");

    if (!res.ok) {
      const errorText = await res.text();
      let errorMessage = "Failed to fetch orders";
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        console.error("Non-JSON error response:", errorText);
      }
      throw new Error(errorMessage);
    }

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch orders");
    }

    // --- THIS IS THE FIX ---
    // 1. Check if data.orders exists and is an array. If not, use an empty array.
    const ordersArray = Array.isArray(data.orders) ? data.orders : [];

    // 2. Map over the guaranteed 'ordersArray'
    const mappedOrders: Order.Order[] = ordersArray.map((order: any) => ({
      id: order.id ?? "",
      userId: order.userId ?? "",
      paymentIntentId: order.paymentIntentId,
      amount: order.amount,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      items: order.items ?? [],
      shippingAddress: order.shippingAddress ?? {
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: ""
      },
      status: order.status ?? "processing",
      // Safely create Date objects
      createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
      updatedAt: order.updatedAt ? new Date(order.updatedAt) : new Date()
    }));

    return mappedOrders;
  } catch (error) {
    console.error("Error fetching user orders:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to fetch your orders.");
  }
}
