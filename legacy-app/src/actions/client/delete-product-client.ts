// src/actions/client/delete-product.ts
"use client";

export async function deleteProductClient(productId: string) {
  try {
    const response = await fetch(`/api/products/${productId}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || "Failed to delete product" };
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting product:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}
