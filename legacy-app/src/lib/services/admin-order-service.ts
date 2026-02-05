// ===============================
// 📂 src/lib/services/admin-order-service.ts
// Canonical admin order service (Firestore)
// ===============================

import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { orderSchema } from "@/schemas/order";
import type { Order, OrderData } from "@/types/order";
import { logger } from "@/utils/logger";

import type { ServiceResponse } from "@/lib/services/types/service-response";

// Server timestamp helper (keep same semantics as before)
export const serverTimestamp = () => FieldValue.serverTimestamp();

type EmptyData = Record<string, never>;
type FirestoreData = Record<string, unknown>;

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function asNumber(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
function asTimestampDate(v: unknown): Date | undefined {
  return v instanceof Timestamp ? v.toDate() : undefined;
}

function isOrderStatus(v: unknown): v is Order["status"] {
  return v === "pending" || v === "processing" || v === "shipped" || v === "delivered" || v === "cancelled";
}

function mapItems(v: unknown): Order["items"] {
  if (!Array.isArray(v)) return [];
  return v
    .map(it => (typeof it === "object" && it !== null ? (it as Record<string, unknown>) : null))
    .filter(Boolean)
    .map(it => ({
      productId: asString(it?.productId),
      name: asString(it?.name, "Product"),
      price: asNumber(it?.price, 0),
      quantity: Math.max(1, asNumber(it?.quantity, 1)),
      image: typeof it?.image === "string" ? it.image : undefined
    }));
}

function mapShippingAddress(v: unknown): Order["shippingAddress"] {
  const a = typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {};
  return {
    name: asString(a.name),
    address: asString(a.address),
    city: asString(a.city),
    state: asString(a.state),
    zipCode: asString(a.zipCode),
    country: asString(a.country)
  };
}

/**
 * Maps a Firestore document to an Order object
 */
function mapDocToOrder(doc: FirebaseFirestore.DocumentSnapshot): Order {
  const data = (doc.data() ?? {}) as FirestoreData;

  const statusRaw = data.status;
  const status: Order["status"] = isOrderStatus(statusRaw) ? statusRaw : "processing";

  // IMPORTANT: keep nulls as nulls for userId
  const userIdRaw = data.userId;
  const userId: string | null = typeof userIdRaw === "string" ? userIdRaw : userIdRaw === null ? null : null;

  return {
    id: doc.id,
    paymentIntentId: asString(data.paymentIntentId),
    amount: asNumber(data.amount, 0),
    customerEmail: asString(data.customerEmail),
    customerName: asString(data.customerName),
    items: mapItems(data.items),
    shippingAddress: mapShippingAddress(data.shippingAddress),
    userId,
    status,
    currency: typeof data.currency === "string" ? data.currency : undefined,
    createdAt: asTimestampDate(data.createdAt),
    updatedAt: asTimestampDate(data.updatedAt)
  };
}

function errMessage(error: unknown, fallback: string) {
  return isFirebaseError(error) ? firebaseError(error) : error instanceof Error ? error.message : fallback;
}

export const adminOrderService = {
  /**
   * Creates a new order in Firestore (idempotent by paymentIntentId).
   * Returns { orderId } in the success payload.
   */
  async createOrder(orderData: OrderData): Promise<ServiceResponse<{ orderId: string }>> {
    const db = getAdminFirestore();

    try {
      const validatedData = orderSchema.parse(orderData);

      // Idempotency: if an order already exists for this paymentIntentId, return it.
      const existing = await db
        .collection("orders")
        .where("paymentIntentId", "==", validatedData.paymentIntentId)
        .limit(1)
        .get();

      if (!existing.empty) {
        return { success: true, data: { orderId: existing.docs[0].id } };
      }

      const finalAmount = validatedData.amount;

      const orderRef = await db.collection("orders").add({
        ...validatedData,
        userId: validatedData.userId ?? null,
        status: validatedData.status || "processing",
        amount: finalAmount,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return { success: true, data: { orderId: orderRef.id } };
    } catch (error: unknown) {
      console.error("Error creating order in Firestore:", error);
      return { success: false, error: errMessage(error, "Unknown error"), status: 500 };
    }
  },

  /**
   * Fetches all orders belonging to a specific user
   */
  async getUserOrders(userId: string): Promise<ServiceResponse<Order[]>> {
    try {
      const db = getAdminFirestore();
      const snapshot = await db.collection("orders").where("userId", "==", userId).orderBy("createdAt", "desc").get();

      const orders = snapshot.docs.map(mapDocToOrder);
      return { success: true, data: orders };
    } catch (error: unknown) {
      console.error("Error fetching user orders:", error);
      return { success: false, error: errMessage(error, "Unknown error"), status: 500 };
    }
  },

  /**
   * Fetches a single order by its Stripe Payment Intent ID
   */
  async getOrderByPaymentIntentId(paymentIntentId: string): Promise<ServiceResponse<Order | null>> {
    try {
      const db = getAdminFirestore();
      const snapshot = await db.collection("orders").where("paymentIntentId", "==", paymentIntentId).limit(1).get();

      if (snapshot.empty) {
        return { success: true, data: null };
      }

      return { success: true, data: mapDocToOrder(snapshot.docs[0]) };
    } catch (error: unknown) {
      console.error("Error fetching order by Payment Intent ID:", error);

      logger({
        type: "error",
        message: "Failed to fetch order by Payment Intent ID",
        metadata: { error, paymentIntentId },
        context: "orders"
      });

      return { success: false, error: errMessage(error, "Unknown error"), status: 500 };
    }
  },

  /**
   * Fetches all orders (Admin use)
   */
  async getAllOrders(): Promise<ServiceResponse<Order[]>> {
    try {
      const db = getAdminFirestore();
      const snapshot = await db.collection("orders").orderBy("createdAt", "desc").get();

      const orders = snapshot.docs.map(mapDocToOrder);
      return { success: true, data: orders };
    } catch (error: unknown) {
      console.error("Error fetching all orders:", error);

      logger({
        type: "error",
        message: "Failed to fetch all orders",
        metadata: { error },
        context: "orders"
      });

      return { success: false, error: errMessage(error, "Unknown error"), status: 500 };
    }
  },

  /**
   * Fetches a single order by ID (Admin use)
   */
  async getOrderById(id: string): Promise<ServiceResponse<Order | null>> {
    try {
      const db = getAdminFirestore();
      const doc = await db.collection("orders").doc(id).get();

      if (!doc.exists) {
        return { success: true, data: null };
      }

      return { success: true, data: mapDocToOrder(doc) };
    } catch (error: unknown) {
      console.error("Error fetching order by ID:", error);

      logger({
        type: "error",
        message: "Failed to fetch order by ID",
        metadata: { error, id },
        context: "orders"
      });

      return { success: false, error: errMessage(error, "Unknown error"), status: 500 };
    }
  },

  /**
   * Update a single order status by ID (Admin use)
   */
  async updateOrderStatus(orderId: string, status: Order["status"]): Promise<ServiceResponse<EmptyData>> {
    try {
      const db = getAdminFirestore();

      await db.collection("orders").doc(orderId).update({
        status,
        updatedAt: serverTimestamp()
      });

      logger({
        type: "order:status",
        message: `Order status updated to ${status}`,
        context: "orders",
        metadata: { orderId, status }
      });

      return { success: true, data: {} };
    } catch (error: unknown) {
      console.error("Error updating order status:", error);

      logger({
        type: "error",
        message: "Failed to update order status",
        context: "orders",
        metadata: { orderId, error }
      });

      return { success: false, error: errMessage(error, "Unknown error"), status: 500 };
    }
  }
};
