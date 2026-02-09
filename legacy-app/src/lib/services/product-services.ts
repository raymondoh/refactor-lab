// src/lib/services/product-services.ts

import { getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";

// Get product sample for debugging
export async function getProductSample(limit = 5): Promise<Array<Record<string, unknown> & { id: string }>> {
  try {
    const db = getAdminFirestore();
    const productsRef = db.collection("products");
    const querySnapshot = await productsRef.limit(limit).get();

    const products: Array<Record<string, unknown> & { id: string }> = [];

    querySnapshot.forEach(doc => {
      const data = (doc.data() ?? {}) as Record<string, unknown>;

      products.push({
        id: doc.id,
        ...data
      });
    });

    return products;
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error occurred while fetching product sample";

    console.error("Error fetching product sample:", message);
    return [];
  }
}

// Fix missing onSale field for all products
export async function fixMissingOnSaleField(): Promise<
  | {
      success: true;
      fixed: number;
      alreadyHadField: number;
      total: number;
      message: string;
    }
  | {
      success: false;
      error: string;
    }
> {
  try {
    const db = getAdminFirestore();

    // Get all products
    const snapshot = await db.collection("products").get();

    const updates: Promise<FirebaseFirestore.WriteResult>[] = [];
    let fixedCount = 0;
    let alreadyHadField = 0;

    snapshot.docs.forEach(doc => {
      const data = (doc.data() ?? {}) as Record<string, unknown>;

      const onSale = data["onSale"];

      // Check if onSale field exists
      if (onSale === undefined || onSale === null) {
        const name = typeof data["name"] === "string" ? data["name"] : "Unknown";

        console.log(`Fixing product ${name}: adding onSale: false`);

        updates.push(
          doc.ref.update({
            onSale: false
          })
        );

        fixedCount++;
      } else {
        alreadyHadField++;
      }
    });

    if (updates.length > 0) {
      await Promise.all(updates);
      console.log(`✅ Fixed ${fixedCount} products with missing onSale field`);
    } else {
      console.log("ℹ️ All products already have onSale field");
    }

    return {
      success: true,
      fixed: fixedCount,
      alreadyHadField,
      total: snapshot.docs.length,
      message: `Fixed ${fixedCount} products, ${alreadyHadField} already had the field`
    };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error occurred while fixing onSale field";

    console.error("Error fixing onSale field:", message);

    return {
      success: false,
      error: message
    };
  }
}
