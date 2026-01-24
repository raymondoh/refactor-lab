"use client";

import { toast } from "sonner";
import type { Product } from "@/types";
// 1. Import the schema (ensure this path and export name are correct)
import { productUpdateSchema } from "@/schemas/product";

export async function updateProductClient(
  productId: string,
  data: Product.UpdateProductInput
): Promise<Product.UpdateProductResult> {
  try {
    // 2. Client-side validation
    const validationResult = productUpdateSchema.safeParse(data);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors
        .map(err => `${err.path.join(".")} - ${err.message}`)
        .join("; ");
      toast.error(`Client-side validation failed: ${errorMessages}`);
      console.error("❌ Client-side validation failed:", validationResult.error.flatten());
      return {
        success: false,
        error: `Client-side validation failed: ${errorMessages}`
      };
    }

    // Use validatedData for the API call
    const validatedDataForApi = validationResult.data;

    console.log("🚀 updateProductClient - Starting update for product:", productId);
    console.log("📋 Update data (post-client-validation):", JSON.stringify(validatedDataForApi, null, 2));

    const response = await fetch(`/api/products/${productId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(validatedDataForApi)
    });

    // ---- RESPONSE HANDLING LOGIC ----
    console.log("📡 API Response status:", response.status);
    // You can log headers if needed for debugging:
    // console.log("📡 API Response headers:", Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log("📡 Raw response text from server:", responseText);

    if (!response.ok) {
      let errorData: { error?: string; message?: string } = {};
      try {
        // Attempt to parse error response as JSON, as your API might send structured errors
        errorData = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error("❌ Failed to parse error response as JSON:", parseError);
        // If JSON parsing fails, use the raw status text or responseText as the error
        errorData = { error: `Server returned: ${response.status} ${response.statusText}` };
      }

      const errorMessage =
        errorData.error ||
        errorData.message ||
        responseText ||
        `Failed to update product: ${response.status} ${response.statusText}`;
      console.error("❌ Error response from API:", errorMessage);
      toast.error(errorMessage); // Display API error to the user
      return {
        success: false,
        error: errorMessage
      };
    }

    // If response.ok is true, attempt to parse the success response
    let result: Product.UpdateProductResult;
    try {
      // The server should be sending JSON compatible with Product.UpdateProductResult
      // e.g., { success: true, data: "product_id" } or { success: true }
      result = responseText ? JSON.parse(responseText) : { success: true }; // If responseText is empty for a 2xx, assume success (though API should send JSON)

      // A basic check to ensure the parsed object has the 'success' property
      if (typeof result.success !== "boolean") {
        console.error("❌ Parsed response is missing 'success' property:", result);
        throw new Error("Parsed response does not conform to expected structure.");
      }
    } catch (parseError) {
      console.error("❌ Failed to parse success response as JSON:", parseError);
      console.error("❌ Raw response was:", responseText);
      const errorMessage = "Invalid response format from server.";
      toast.error(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }

    console.log("✅ Parsed update product result from API:", result);

    // Handle the result (e.g., show toast notifications)
    if (result.success) {
      toast.success("Product updated successfully!");
    } else if (result.error) {
      // This handles cases where the server API route might explicitly return { success: false, error: "..." } with a 200 OK status.
      toast.error(result.error);
    }

    // Return the processed result from the API
    return result;
    // ---- END OF RESPONSE HANDLING LOGIC ----
  } catch (error) {
    // This catch block handles:
    // 1. Errors from client-side Zod validation (if it throws, though safeParse shouldn't).
    // 2. Network errors from the fetch() call itself (e.g., server unreachable).
    // 3. Any other unexpected errors within the try block.
    console.error("💥 [UPDATE_PRODUCT_CLIENT] Client-side error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown client-side error during product update.";
    toast.error(errorMessage);
    return {
      success: false,
      error: errorMessage
    };
  }
  // Note: The function is typed to return Promise<Product.UpdateProductResult>.
  // All logical paths within the try-catch block should ideally return a value conforming to this type.
  // If TypeScript is satisfied that all paths return, this final fallback return might not be strictly necessary,
  // but it can serve as a safety net. However, if it's reached, it means an unexpected logical flow occurred.
  // Consider if all paths above have explicit returns.
  // For now, to match the previous error, we'll keep it, but ideally, it shouldn't be hit.
  // return { success: false, error: "An unexpected error occurred in updateProductClient." };
}
