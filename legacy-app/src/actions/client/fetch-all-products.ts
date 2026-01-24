// src/actions/client/products.ts
import type { Product } from "@/types";

/**
 * Client-side action to fetch filtered products
 */
export async function fetchAllProductsClient(
  filters?: Product.ProductFilterOptions
): Promise<Product.GetAllProductsResult> {
  try {
    const query = filters
      ? "?" +
        new URLSearchParams(
          Object.entries(filters)
            .filter(([_, value]) => value !== undefined && value !== "")
            .map(([key, value]) => [key, String(value)])
        ).toString()
      : "";

    const res = await fetch(`/api/products${query}`);

    if (!res.ok) {
      console.error("fetchAllProductsClient error:", res.statusText);
      return { success: false, error: res.statusText || "Failed to fetch products" };
    }

    const data = await res.json();
    console.log("[fetchAllProductsClient] Fetched products successfully:", data);

    return data;
  } catch (error) {
    console.error("Error fetching products:", error);
    return { success: false, error: "Failed to fetch products" };
  }
}
