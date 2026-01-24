"use server";

import { createOrder as createOrderInDb } from "@/firebase/admin/orders";
import { revalidatePath } from "next/cache";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import type { OrderData } from "@/types/order";

// This action is now a simple pass-through. The auth() check has been removed.
export async function createNewOrder(orderData: OrderData) {
  console.log("🚀 createNewOrder called with:", JSON.stringify(orderData, null, 2));

  try {
    const result = await createOrderInDb(orderData);

    if (result.success) {
      // Revalidate paths to update user and admin order pages instantly
      revalidatePath("/user/orders");
      revalidatePath("/admin/orders");
    }

    return result;
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error creating order";
    return { success: false, error: message };
  }
}

