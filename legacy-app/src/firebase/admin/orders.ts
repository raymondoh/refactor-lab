// ===============================
// 📂 src/firebase/admin/orders.ts
// ===============================

// ================= Imports =================
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { orderSchema } from "@/schemas/order";
import type { Order, OrderData } from "@/types/order";
import { logger } from "@/utils/logger";
import { TAX_RATE, SHIPPING_CONFIG } from "@/config/checkout";

// ================= Types =================
export type { OrderData };

// ================= Helper Functions =================

/**
 * Maps a Firestore document to an OrderData object
 */
function mapDocToOrder(doc: any): Order {
  const data = doc.data() ?? {};

  return {
    id: doc.id,
    paymentIntentId: data?.paymentIntentId || "",
    amount: data?.amount || 0,
    customerEmail: data?.customerEmail || "",
    customerName: data?.customerName || "",
    items: data?.items || [],
    shippingAddress: data?.shippingAddress || {},
    userId: data?.userId || "",
    status: data?.status || "processing",
    createdAt: data?.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined,
    updatedAt: data?.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined
  };
}

// Server timestamp helper
export const serverTimestamp = () => {
  return FieldValue.serverTimestamp();
};

// ================= Firestore Functions =================

/**
 * Creates a new order in Firestore
 */
export async function createOrder(orderData: OrderData) {
  const db = getAdminFirestore();
  console.log("📦 Got Firestore instance:", !!db);
  // Optional: confirm Admin SDK is in use
  console.log("📦 Is Admin SDK:", typeof db?.collection === "function");
  try {
    const validatedData = orderSchema.parse(orderData); // Zod validation
    console.log("🧾 createOrderInDb validated data:", validatedData);

    const finalAmount = validatedData.amount;
    console.log("🧾 createOrderInDb final amount:", finalAmount); // Log final amount
    const existingOrder = await db
      .collection("orders")
      .where("paymentIntentId", "==", validatedData.paymentIntentId)
      .limit(1)
      .get();

    if (!existingOrder.empty) {
      console.log("Duplicate webhook received, order already exists:", existingOrder.docs[0].id);
      return { success: true, orderId: existingOrder.docs[0].id }; // Acknowledge success
    }

    const orderRef = await db.collection("orders").add({
      ...validatedData,
      userId: validatedData.userId, // Can be null
      status: validatedData.status || "processing",
      amount: finalAmount,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log("✅ Firestore order created with ID:", orderRef.id);

    return {
      success: true,
      orderId: orderRef.id
    };
  } catch (error) {
    // --- FIX: Log the full error object for detailed debugging ---
    console.error("Error creating order in Firestore:", error);
    // --- END FIX ---
    const message = error instanceof Error ? error.message : "Unknown error while creating order in Firestore.";
    return { success: false, error: message };
  }
}

/**
 * Fetches all orders belonging to a specific user
 */
export async function getUserOrders(userId: string) {
  try {
    const db = getAdminFirestore();
    const snapshot = await db.collection("orders").where("userId", "==", userId).orderBy("createdAt", "desc").get();

    const orders = snapshot.docs.map(mapDocToOrder);

    return orders;
  } catch (error) {
    console.error("Error fetching user orders:", error);
    throw new Error("Failed to fetch user orders");
  }
}

/**
 * Fetches a single order by its Stripe Payment Intent ID
 */
export async function getOrderByPaymentIntentId(paymentIntentId: string) {
  try {
    const db = getAdminFirestore();
    const snapshot = await db.collection("orders").where("paymentIntentId", "==", paymentIntentId).limit(1).get();

    if (snapshot.empty) {
      return null;
    }

    return mapDocToOrder(snapshot.docs[0]);
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
        : "Unknown error while fetching order by Payment Intent ID";

    throw new Error(message);
  }
}

/**
 * Fetches all orders (Admin use)
 */
export async function getAllOrders() {
  try {
    const db = getAdminFirestore();
    const snapshot = await db.collection("orders").orderBy("createdAt", "desc").get();

    const orders = snapshot.docs.map(mapDocToOrder);

    return orders;
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
        : "Unknown error while fetching all orders";

    throw new Error(message);
  }
}

/**
 * Fetches a single order by ID (Admin use)
 */
export async function getOrderById(id: string) {
  try {
    const db = getAdminFirestore();
    const doc = await db.collection("orders").doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return mapDocToOrder(doc);
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
        : "Unknown error while fetching order";

    throw new Error(message);
  }
}

/**
 * Update a single order by ID (Admin use)
 */
export async function updateOrderStatus(orderId: string, status: Order["status"]) {
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

    return { success: true };
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
        : "Unknown error while updating order status";

    return { success: false, error: message };
  }
}
