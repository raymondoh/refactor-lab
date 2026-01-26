import { type NextRequest, NextResponse } from "next/server";
import { adminProductService } from "@/lib/services/admin-product-service";
import type { Product } from "@/types";
import { logActivity } from "@/firebase/actions";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const getBooleanParam = (param: string | null): boolean | undefined => {
      if (param === null) return undefined;
      return param === "true";
    };

    const getArrayParam = (param: string | null): string[] | undefined => {
      if (param === null) return undefined;
      return param
        .split(",")
        .map(s => s.trim())
        .filter(s => s.length > 0);
    };

    const filters: Product.ProductFilterOptions = {
      category: searchParams.get("category") || undefined,
      subcategory: searchParams.get("subcategory") || undefined,
      material: searchParams.get("material") || undefined,
      priceRange: searchParams.get("priceRange") || undefined,
      isFeatured: getBooleanParam(searchParams.get("isFeatured")),
      stickySide: searchParams.get("stickySide") || undefined,

      designThemes: getArrayParam(searchParams.get("designThemes")),
      productType: searchParams.get("productType") || undefined,
      finish: searchParams.get("finish") || undefined,
      placements: getArrayParam(searchParams.get("placements")),
      isCustomizable: getBooleanParam(searchParams.get("isCustomizable")),
      brand: searchParams.get("brand") || undefined,
      tags: getArrayParam(searchParams.get("tags")),
      onSale: getBooleanParam(searchParams.get("onSale")),
      isNewArrival: getBooleanParam(searchParams.get("isNewArrival")),
      inStock: getBooleanParam(searchParams.get("inStock")),
      baseColor: searchParams.get("baseColor") || undefined,
      query: searchParams.get("query") || undefined
    };

    // Remove undefined keys
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof Product.ProductFilterOptions] === undefined) {
        delete filters[key as keyof Product.ProductFilterOptions];
      }
    });

    const result = await adminProductService.getAllProducts(filters);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status ?? 500 });
    }

    // Maintain legacy API response shape: { success, data }
    return NextResponse.json({ success: true, data: result.data }, { status: 200 });
  } catch (error) {
    console.error("Error in /api/products:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const data = await request.json();

    // Minimal safety (kept from original)
    if (!data.image || typeof data.image !== "string" || !data.image.startsWith("http")) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid product data",
          details: "A valid image URL is required"
        },
        { status: 400 }
      );
    }

    const result = await adminProductService.addProduct(data);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status ?? 400 });
    }

    // Log activity (best-effort)
    try {
      await logActivity({
        userId: session.user.id,
        type: "create_product",
        description: `Created product: ${data.name}`,
        status: "success",
        metadata: {
          productId: result.data.id,
          productName: data.name,
          price: data.price
        }
      });
    } catch (logError) {
      console.error("Failed to log activity:", logError);
    }

    // Maintain legacy response shape from old addProduct:
    // { success: true, id, product }
    return NextResponse.json({
      success: true,
      id: result.data.id,
      product: result.data.product
    });
  } catch (error) {
    console.error("[POST /api/products]", error);

    // Safely attempt to read body for logging (clone)
    let data: any;
    try {
      data = await request.clone().json();
    } catch {
      data = { name: "Unknown" };
    }

    // Log failed attempt (best-effort)
    try {
      const { auth } = await import("@/auth");
      const session = await auth();
      if (session?.user) {
        await logActivity({
          userId: session.user.id,
          type: "create_product",
          description: `Failed to create product: ${error instanceof Error ? error.message : "Unknown error"}`,
          status: "error",
          metadata: {
            error: error instanceof Error ? error.message : "Unknown error",
            attemptedProductName: data?.name || "Unknown"
          }
        });
      }
    } catch (logError) {
      console.error("Failed to log error activity:", logError);
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 }
    );
  }
}
