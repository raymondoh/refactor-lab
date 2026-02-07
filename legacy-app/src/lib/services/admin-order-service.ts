// ===============================
// 📂 src/lib/services/admin-order-service.ts
// Canonical admin order service (Firestore)
// ===============================

import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { orderSchema } from "@/schemas/order";
import type { Order, OrderData } from "@/types/order";
import { logServerEvent } from "@/lib/services/logging-service";

import type { ServiceResponse } from "@/lib/services/types/service-response";
import { requireAdmin } from "@/actions/_helpers/require-admin";

// Server timestamp helper
export const serverTimestamp = () => FieldValue.serverTimestamp();

type EmptyData = Record<string, never>;
type FirestoreData = Record<string, unknown>;

/* ---------------------------------- */
/* Helpers */
/* ---------------------------------- */

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

function mapDocToOrder(doc: FirebaseFirestore.DocumentSnapshot): Order {
  const data = (doc.data() ?? {}) as FirestoreData;
  const statusRaw = data.status;
  const status: Order["status"] = isOrderStatus(statusRaw) ? statusRaw : "processing";
  const userIdRaw = data.userId;
  const userId: string | null = typeof userIdRaw === "string" ? userIdRaw : null;

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

/* ---------------------------------- */
/* Service Implementation */
/* ---------------------------------- */

/**
 * INTERNAL CORE LOGIC
 * Callable by webhooks (System) or Admin actions (Session).
 * No requireAdmin gate here; security is handled by the caller.
 */
async function _createOrderInternal(orderData: OrderData): Promise<ServiceResponse<{ orderId: string }>> {
  const db = getAdminFirestore();

  try {
    const validatedData = orderSchema.parse(orderData);

    // Idempotency check: lookup by paymentIntentId
    const existing = await db
      .collection("orders")
      .where("paymentIntentId", "==", validatedData.paymentIntentId)
      .limit(1)
      .get();

    if (!existing.empty) {
      return { success: true, data: { orderId: existing.docs[0].id } };
    }

    const orderRef = await db.collection("orders").add({
      ...validatedData,
      userId: validatedData.userId ?? null,
      status: validatedData.status || "processing",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return { success: true, data: { orderId: orderRef.id } };
  } catch (error: unknown) {
    const message = errMessage(error, "Failed to create order");
    await logServerEvent({
      type: "error",
      message: `Order Creation Error: ${message}`,
      context: "order:system",
      metadata: { orderData, error }
    });
    return { success: false, error: message, status: 500 };
  }
}

export const adminOrderService = {
  /**
   * SYSTEM: Webhook entry point. No session required.
   * Call this from /api/webhooks/stripe
   */
  async createOrderFromWebhook(orderData: OrderData) {
    return _createOrderInternal(orderData);
  },

  /**
   * ADMIN: Dashboard entry point. Requires admin session.
   */
  async createOrder(orderData: OrderData) {
    const gate = await requireAdmin();
    if (!gate.success) return gate;
    return _createOrderInternal(orderData);
  },

  /**
   * USER: Fetch personal orders (Used by UserOrdersClient)
   */
  async getUserOrders(userId: string): Promise<ServiceResponse<Order[]>> {
    // Only authenticated users can call this (check logic usually in Action)
    try {
      const db = getAdminFirestore();
      const snapshot = await db.collection("orders").where("userId", "==", userId).orderBy("createdAt", "desc").get();

      return { success: true, data: snapshot.docs.map(mapDocToOrder) };
    } catch (error: unknown) {
      return { success: false, error: errMessage(error, "Unknown error"), status: 500 };
    }
  },

  /**
   * ADMIN: Fetch all orders for management
   */
  async getAllOrders(): Promise<ServiceResponse<Order[]>> {
    const gate = await requireAdmin();
    if (!gate.success) return gate;

    try {
      const db = getAdminFirestore();
      const snapshot = await db.collection("orders").orderBy("createdAt", "desc").get();
      return { success: true, data: snapshot.docs.map(mapDocToOrder) };
    } catch (error: unknown) {
      return { success: false, error: errMessage(error, "Unknown error"), status: 500 };
    }
  },

  async getOrderById(id: string): Promise<ServiceResponse<Order | null>> {
    const gate = await requireAdmin();
    if (!gate.success) return gate;

    try {
      const db = getAdminFirestore();
      const doc = await db.collection("orders").doc(id).get();
      if (!doc.exists) return { success: true, data: null };
      return { success: true, data: mapDocToOrder(doc) };
    } catch (error: unknown) {
      return { success: false, error: errMessage(error, "Unknown error"), status: 500 };
    }
  },

  async updateOrderStatus(orderId: string, status: Order["status"]): Promise<ServiceResponse<EmptyData>> {
    const gate = await requireAdmin();
    if (!gate.success) return gate;

    try {
      const db = getAdminFirestore();
      await db.collection("orders").doc(orderId).update({
        status,
        updatedAt: serverTimestamp()
      });

      await logServerEvent({
        type: "order:status",
        message: `Order status updated to ${status}`,
        context: "orders",
        metadata: { orderId, status, adminId: gate.userId }
      });

      return { success: true, data: {} };
    } catch (error: unknown) {
      return { success: false, error: errMessage(error, "Unknown error"), status: 500 };
    }
  },
  async getOrderByPaymentIntentId(paymentIntentId: string): Promise<ServiceResponse<Order | null>> {
    try {
      const db = getAdminFirestore();
      const snapshot = await db.collection("orders").where("paymentIntentId", "==", paymentIntentId).limit(1).get();

      if (snapshot.empty) return { success: true, data: null };
      return { success: true, data: mapDocToOrder(snapshot.docs[0]) };
    } catch (error) {
      return { success: false, error: errMessage(error, "Failed to fetch order"), status: 500 };
    }
  }
};
