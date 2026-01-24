// actions/client/fetch-user-likes-client.ts
"use client";

import type { Product } from "@/types";

export async function fetchUserLikesClient(): Promise<Product.Product[]> {
  try {
    // Fetch the user's liked products directly from the API
    const res = await fetch("/api/likes/products");

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to fetch liked products");
    }

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch liked products");
    }

    return data.products || [];
  } catch (error) {
    console.error("Error fetching liked products:", error);
    throw error;
  }
}
