// src/actions/client/products.ts
import type { GetAllProductsResult } from "@/types/api/product-results";
import type { ProductFilterOptions } from "@/types/filters/product-filters";

/**
 * Client-side action to fetch filtered products
 */
export async function fetchAllProductsClient(
  filters?: ProductFilterOptions
): Promise<GetAllProductsResult> {
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
