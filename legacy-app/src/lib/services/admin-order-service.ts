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

type ServiceResponse<T> = { success: true; data: T } | { success: false; error: string; status?: number };

// Server timestamp helper (keep same semantics as before)
export const serverTimestamp = () => FieldValue.serverTimestamp();

/**
 * Maps a Firestore document to an Order object
 */
function mapDocToOrder(doc: FirebaseFirestore.DocumentSnapshot): Order {
  const data = doc.data() ?? {};

  return {
    id: doc.id,
    paymentIntentId: (data as any)?.paymentIntentId || "",
    amount: (data as any)?.amount || 0,
    customerEmail: (data as any)?.customerEmail || "",
    customerName: (data as any)?.customerName || "",
    items: (data as any)?.items || [],
    shippingAddress: (data as any)?.shippingAddress || {},
    userId: (data as any)?.userId || "",
    status: (data as any)?.status || "processing",
    createdAt: (data as any)?.createdAt instanceof Timestamp ? (data as any).createdAt.toDate() : undefined,
    updatedAt: (data as any)?.updatedAt instanceof Timestamp ? (data as any).updatedAt.toDate() : undefined
  };
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
        userId: validatedData.userId, // can be null
        status: validatedData.status || "processing",
        amount: finalAmount,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return { success: true, data: { orderId: orderRef.id } };
    } catch (error) {
      console.error("Error creating order in Firestore:", error);

      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error";

      return { success: false, error: message, status: 500 };
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
    } catch (error) {
      console.error("Error fetching user orders:", error);

      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error";

      return { success: false, error: message, status: 500 };
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
    } catch (error) {
      console.error("Error fetching order by Payment Intent ID:", error);

      logger({
        type: "error",
        message: "Failed to fetch order by Payment Intent ID",
        metadata: { error, paymentIntentId },
        context: "orders"
      });

      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error";

      return { success: false, error: message, status: 500 };
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
    } catch (error) {
      console.error("Error fetching all orders:", error);

      logger({
        type: "error",
        message: "Failed to fetch all orders",
        metadata: { error },
        context: "orders"
      });

      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error";

      return { success: false, error: message, status: 500 };
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
    } catch (error) {
      console.error("Error fetching order by ID:", error);

      logger({
        type: "error",
        message: "Failed to fetch order by ID",
        metadata: { error, id },
        context: "orders"
      });

      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error";

      return { success: false, error: message, status: 500 };
    }
  },

  /**
   * Update a single order status by ID (Admin use)
   */
  async updateOrderStatus(orderId: string, status: Order["status"]): Promise<ServiceResponse<{}>> {
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
    } catch (error) {
      console.error("Error updating order status:", error);

      logger({
        type: "error",
        message: "Failed to update order status",
        context: "orders",
        metadata: { orderId, error }
      });

      const message = isFirebaseError(error)
        ? firebaseError(error)
        : error instanceof Error
          ? error.message
          : "Unknown error";

      return { success: false, error: message, status: 500 };
    }
  }
};
