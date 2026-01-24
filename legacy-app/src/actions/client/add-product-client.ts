"use client";
import type { Product } from "@/types";

export async function addProductClient(data: Omit<Product.Product, "id" | "createdAt" | "updatedAt">) {
  try {
    // If no SKU is provided, it will be auto-generated on the server
    // based on the product ID

    const response = await fetch("/api/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || "Failed to add product" };
    }

    const result = await response.json();
    return { success: true, id: result.id, product: result.product };
  } catch (error) {
    console.error("[addProductClient]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred"
    };
  }
}
