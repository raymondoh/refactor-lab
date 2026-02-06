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
        const errorData: unknown = JSON.parse(errorText);
        if (
          typeof errorData === "object" &&
          errorData !== null &&
          "error" in errorData &&
          typeof (errorData as Record<string, unknown>).error === "string"
        ) {
          errorMessage = (errorData as Record<string, string>).error;
        }
      } catch {
        console.error("Non-JSON error response:", errorText);
      }
      throw new Error(errorMessage);
    }

    const raw: unknown = await res.json();

    if (typeof raw !== "object" || raw === null || !("success" in raw)) {
      throw new Error("Invalid response format");
    }

    const data = raw as {
      success: boolean;
      error?: string;
      orders?: unknown;
    };

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch orders");
    }

    const ordersArray = Array.isArray(data.orders) ? data.orders : [];

    const mappedOrders: Order.Order[] = ordersArray.map((order): Order.Order => {
      const o = typeof order === "object" && order !== null ? (order as Record<string, unknown>) : {};

      return {
        id: typeof o.id === "string" ? o.id : "",
        userId: typeof o.userId === "string" ? o.userId : "",
        paymentIntentId: typeof o.paymentIntentId === "string" ? o.paymentIntentId : undefined,
        amount: typeof o.amount === "number" ? o.amount : 0,
        customerEmail: typeof o.customerEmail === "string" ? o.customerEmail : "",
        customerName: typeof o.customerName === "string" ? o.customerName : "",
        items: Array.isArray(o.items) ? o.items : [],
        shippingAddress:
          typeof o.shippingAddress === "object" && o.shippingAddress !== null
            ? (o.shippingAddress as Order.Order["shippingAddress"])
            : {
                address: "",
                city: "",
                state: "",
                zipCode: "",
                country: ""
              },
        status: typeof o.status === "string" ? o.status : "processing",
        createdAt: typeof o.createdAt === "string" || o.createdAt instanceof Date ? new Date(o.createdAt) : new Date(),
        updatedAt: typeof o.updatedAt === "string" || o.updatedAt instanceof Date ? new Date(o.updatedAt) : new Date()
      };
    });

    return mappedOrders;
  } catch (error) {
    console.error("Error fetching user orders:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to fetch your orders.");
  }
}
