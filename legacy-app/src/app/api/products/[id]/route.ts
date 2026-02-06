// legacy-app/src/app/api/products/[id]/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { productUpdateSchema } from "@/schemas/product";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/firebase/actions";

// ✅ PUBLIC GET
import { getProductByIdPublic } from "@/lib/services/products-public-service";

// ✅ ADMIN writes
import { adminProductService } from "@/lib/services/admin-product-service";

type ApiErrorDetails = {
  success: false;
  error: string;
  timestamp: string;
  productId: string;
  stack?: string;
};

// GET - Fetch a single product by ID (PUBLIC)
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: "Product ID is required" }, { status: 400 });
    }

    // ✅ IMPORTANT: public GET should NOT call adminProductService (it calls auth())
    const result = await getProductByIdPublic(id);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status ?? 404 });
    }

    // Maintain legacy response: { success, data: product }
    return NextResponse.json({ success: true, data: result.data.product }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/products/[id]] Uncaught error in GET handler:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PUT - Update a product (ADMIN)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required" }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
          details: parseError instanceof Error ? parseError.message : "Unknown parse error"
        },
        { status: 400 }
      );
    }

    const validated = productUpdateSchema.safeParse(body);

    if (!validated.success) {
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

    const result = await adminProductService.updateProduct(id, validated.data);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to update product",
          productId: id,
          timestamp: new Date().toISOString()
        },
        { status: result.status ?? 400 }
      );
    }

    // Log activity (best-effort)
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
    }

    // Revalidate relevant paths (best-effort)
    try {
      revalidatePath("/admin/products");
      revalidatePath(`/admin/products/${id}`);
      revalidatePath(`/products/${id}`);
      revalidatePath("/products");
      revalidatePath("/");
    } catch (revalidateError) {
      console.error("⚠️ Failed to revalidate paths:", revalidateError);
    }

    return NextResponse.json({
      success: true,
      data: result.data.id,
      productId: id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("💥 [PUT /api/products/[id]] Unexpected error:", error);

    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";

    const errorDetails: ApiErrorDetails = {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      productId: "unknown",
      ...(process.env.NODE_ENV === "development" && {
        stack: error instanceof Error ? error.stack : undefined
      })
    };

    try {
      const { id } = await params;
      errorDetails.productId = id;
    } catch {
      // ignore
    }

    // Log failed update (best-effort)
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

// DELETE - Remove a product (ADMIN)
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required" }, { status: 403 });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "Product ID is required" }, { status: 400 });
    }

    const result = await adminProductService.deleteProduct(id);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status ?? 400 });
    }

    // Log activity (best-effort)
    try {
      await logActivity({
        userId: session.user.id,
        type: "delete_product",
        description: `Deleted product with ID: ${id}`,
        status: "success",
        metadata: { productId: id }
      });
    } catch (logError) {
      console.error("⚠️ Failed to log activity:", logError);
    }

    // Revalidate paths (best-effort)
    try {
      revalidatePath("/admin/products");
      revalidatePath("/products");
      revalidatePath("/");
    } catch (revalidateError) {
      console.error("⚠️ Failed to revalidate paths:", revalidateError);
    }

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
      productId: id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("💥 [DELETE /api/products/[id]] Unexpected error:", error);

    const errorMessage = error instanceof Error ? error.message : "Failed to delete product";

    const errorDetails: ApiErrorDetails = {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      productId: "unknown",
      ...(process.env.NODE_ENV === "development" && {
        stack: error instanceof Error ? error.stack : undefined
      })
    };

    try {
      const { id } = await params;
      errorDetails.productId = id;
    } catch {
      // ignore
    }

    // Log failed delete (best-effort)
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
