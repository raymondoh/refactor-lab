import { type NextRequest, NextResponse } from "next/server";
import { getProductById, updateProduct, deleteProduct } from "@/firebase/admin/products";
import { productUpdateSchema } from "@/schemas/product";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/firebase/actions";

// GET - Fetch a single product by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  console.log("[GET /api/products/[id]] Handler invoked.");
  try {
    // Await params in Next.js 15
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: "Product ID is required" }, { status: 400 });
    }

    console.log(`[GET /api/products/[id]] Processing for ID: ${id}`);

    const result = await getProductById(id);
    console.log(`[GET /api/products/[id]] Result from getProductById for ID ${id}:`, result);

    if (result.success) {
      return NextResponse.json({ success: true, data: result.product });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 404 });
    }
  } catch (error) {
    console.error("[GET /api/products/[id]] Uncaught error in GET handler:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch product"
      },
      { status: 500 }
    );
  }
}

// PUT - Update a product
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params for Next.js 15 compatibility
    const { id } = await params;
    console.log("🔧 PUT /api/products/[id] - Starting update for product:", id);

    // Dynamic import to avoid build-time initialization
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user) {
      console.log("❌ Unauthorized - no session");
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission (admin only for product updates)
    if (session.user.role !== "admin") {
      console.log("❌ Forbidden - user is not admin");
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Parse request body
    let body: any;
    try {
      body = await request.json();
      console.log("📝 Update data received:", JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error("❌ Failed to parse request JSON:", parseError);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
          details: parseError instanceof Error ? parseError.message : "Unknown parse error"
        },
        { status: 400 }
      );
    }

    // Log specific fields for debugging
    if (body.name) {
      console.log(`📝 Attempting to update product name to: "${body.name}"`);
    }

    console.log("🏷️ Sale fields:", {
      onSale: body.onSale,
      salePrice: body.salePrice,
      price: body.price
    });

    // Validate the request body against the schema
    const validated = productUpdateSchema.safeParse(body);

    if (!validated.success) {
      console.error("❌ Validation error:", validated.error);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid product data",
          validationErrors: validated.error.errors,
          details: validated.error.message
        },
        { status: 400 }
      );
    }

    // Log the validated data
    if (validated.data.name) {
      console.log(`✅ Validated product name: "${validated.data.name}"`);
    }

    // Update the product using the new Firebase admin function
    console.log("🚀 Calling updateProduct with validated data");
    const result = await updateProduct(id, validated.data);
    console.log("💾 Update result:", result);

    if (!result.success) {
      console.log("❌ Update failed:", result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to update product",
          productId: id,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Log activity for audit trail
    try {
      await logActivity({
        userId: session.user.id,
        type: "update_product",
        description: `Updated product: ${validated.data.name || "Unknown"}`,
        status: "success",
        metadata: {
          productId: id,
          productName: validated.data.name,
          updatedFields: Object.keys(validated.data),
          onSale: validated.data.onSale,
          salePrice: validated.data.salePrice
        }
      });
    } catch (logError) {
      console.error("⚠️ Failed to log activity:", logError);
      // Continue execution even if logging fails
    }

    // Revalidate relevant paths to ensure UI updates
    try {
      revalidatePath("/admin/products");
      revalidatePath(`/admin/products/${id}`);
      revalidatePath(`/products/${id}`);
      revalidatePath("/products");
      revalidatePath("/"); // Home page might show featured products
    } catch (revalidateError) {
      console.error("⚠️ Failed to revalidate paths:", revalidateError);
      // Continue execution even if revalidation fails
    }

    console.log("✅ Product update completed successfully");
    return NextResponse.json({
      success: true,
      data: result.data,
      productId: id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("💥 [PUT /api/products/[id]] Unexpected error:", error);

    // Prepare error response
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    const errorDetails = {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      productId: "unknown",
      ...(process.env.NODE_ENV === "development" && {
        stack: error instanceof Error ? error.stack : undefined
      })
    };

    // Try to get product ID for error logging
    try {
      const { id } = await params;
      errorDetails.productId = id;
    } catch (paramError) {
      console.error("Could not get product ID from params:", paramError);
    }

    // Log activity for failed update
    try {
      const { auth } = await import("@/auth");
      const session = await auth();
      if (session?.user) {
        await logActivity({
          userId: session.user.id,
          type: "update_product",
          description: `Failed to update product: ${errorMessage}`,
          status: "error",
          metadata: {
            productId: errorDetails.productId,
            error: errorMessage
          }
        });
      }
    } catch (logError) {
      console.error("Failed to log error activity:", logError);
    }

    return NextResponse.json(errorDetails, { status: 500 });
  }
}

// DELETE - Remove a product
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params for Next.js 15 compatibility
    const { id } = await params;
    console.log("🗑️ DELETE /api/products/[id] - Starting deletion for product:", id);

    // Dynamic import to avoid build-time initialization
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user) {
      console.log("❌ Unauthorized - no session");
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission (admin only for product deletion)
    if (session.user.role !== "admin") {
      console.log("❌ Forbidden - user is not admin");
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required" }, { status: 403 });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "Product ID is required" }, { status: 400 });
    }

    // Delete the product using the new Firebase admin function
    const result = await deleteProduct(id);

    if (!result.success) {
      console.log("❌ Delete failed:", result.error);
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    // Log activity for audit trail
    try {
      await logActivity({
        userId: session.user.id,
        type: "delete_product",
        description: `Deleted product with ID: ${id}`,
        status: "success",
        metadata: {
          productId: id
        }
      });
    } catch (logError) {
      console.error("⚠️ Failed to log activity:", logError);
      // Continue execution even if logging fails
    }

    // Revalidate relevant paths
    try {
      revalidatePath("/admin/products");
      revalidatePath("/products");
      revalidatePath("/"); // Home page might show featured products
    } catch (revalidateError) {
      console.error("⚠️ Failed to revalidate paths:", revalidateError);
      // Continue execution even if revalidation fails
    }

    console.log("✅ Product deletion completed successfully");
    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
      productId: id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("💥 [DELETE /api/products/[id]] Unexpected error:", error);

    // Prepare error response
    const errorMessage = error instanceof Error ? error.message : "Failed to delete product";
    const errorDetails = {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      productId: "unknown",
      ...(process.env.NODE_ENV === "development" && {
        stack: error instanceof Error ? error.stack : undefined
      })
    };

    // Try to get product ID for error logging
    try {
      const { id } = await params;
      errorDetails.productId = id;
    } catch (paramError) {
      console.error("Could not get product ID from params:", paramError);
    }

    // Log activity for failed deletion
    try {
      const { auth } = await import("@/auth");
      const session = await auth();
      if (session?.user) {
        await logActivity({
          userId: session.user.id,
          type: "delete_product",
          description: `Failed to delete product: ${errorMessage}`,
          status: "error",
          metadata: {
            productId: errorDetails.productId,
            error: errorMessage
          }
        });
      }
    } catch (logError) {
      console.error("Failed to log error activity:", logError);
    }

    return NextResponse.json(errorDetails, { status: 500 });
  }
}
