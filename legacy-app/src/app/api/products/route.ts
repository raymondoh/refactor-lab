// src/app/api/products/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { getAllProducts, addProduct } from "@/firebase/admin/products";
import type { Product } from "@/types";
import { logActivity } from "@/firebase/actions";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Helper to get boolean from search params
    const getBooleanParam = (param: string | null): boolean | undefined => {
      if (param === null) return undefined;
      return param === "true";
    };

    // Helper to get array from comma-separated search params
    const getArrayParam = (param: string | null): string[] | undefined => {
      if (param === null) return undefined;
      return param
        .split(",")
        .map(s => s.trim())
        .filter(s => s.length > 0);
    };

    const filters: Product.ProductFilterOptions = {
      // Existing filters
      category: searchParams.get("category") || undefined,
      subcategory: searchParams.get("subcategory") || undefined,
      material: searchParams.get("material") || undefined,
      priceRange: searchParams.get("priceRange") || undefined,
      isFeatured: getBooleanParam(searchParams.get("isFeatured")),
      stickySide: searchParams.get("stickySide") || undefined,

      // Newly added filters from ProductFilterOptions
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
      query: searchParams.get("query") || undefined // NEW: Extract the 'query' parameter
    };

    // Remove undefined keys to keep the filter object clean
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof Product.ProductFilterOptions] === undefined) {
        delete filters[key as keyof Product.ProductFilterOptions];
      }
    });

    const result = await getAllProducts(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in /api/products:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Dynamic import to avoid build-time initialization
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission (admin only for product creation)
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const data = await request.json();

    // Check if we're getting a valid image URL
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

    const result = await addProduct(data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Log activity if the logActivity function is available
    try {
      await logActivity({
        userId: session.user.id,
        type: "create_product",
        description: `Created product: ${data.name}`,
        status: "success",
        metadata: {
          productId: result.id,
          productName: data.name,
          price: data.price
        }
      });
    } catch (logError) {
      console.error("Failed to log activity:", logError);
      // Continue execution even if logging fails
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[POST /api/products]", error);
    let data;

    try {
      data = await request.clone().json(); // Use clone() to avoid "body used already" error
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      data = { name: "Unknown" };
    }

    // Log activity for failed product creation
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
