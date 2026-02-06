import { type NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/firebase/actions";
import { getAllProductsPublic } from "@/lib/services/products-public-service";
import { adminProductService } from "@/lib/services/admin-product-service";

function asRecord(v: unknown): Record<string, unknown> {
  return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {};
}
function asString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}
function asNumber(v: unknown): number | undefined {
  return typeof v === "number" ? v : undefined;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const getBooleanParam = (param: string | null): boolean | undefined => {
      if (param === null) return undefined;
      return param === "true";
    };

    // supports:
    // - ?x=a,b
    // - ?x=a&x=b
    // - ?x=a,b&x=c
    const getArrayParamAll = (key: string): string[] | undefined => {
      const all = searchParams.getAll(key);
      if (!all.length) return undefined;

      const items = all
        .flatMap(v => v.split(","))
        .map(s => s.trim())
        .filter(Boolean);

      return items.length ? items : undefined;
    };

    const limit = (() => {
      const raw = searchParams.get("limit");
      const n = raw ? Number(raw) : undefined;
      return Number.isFinite(n) && (n as number) > 0 ? Math.min(n as number, 200) : undefined;
    })();

    const publicFilters = {
      category: searchParams.get("category") || undefined,
      subcategory: searchParams.get("subcategory") || undefined,

      // supports both ?q= and ?query=
      query: searchParams.get("q") || searchParams.get("query") || undefined,

      designThemes: getArrayParamAll("designThemes"),
      onSale: getBooleanParam(searchParams.get("onSale")),
      isCustomizable: getBooleanParam(searchParams.get("isCustomizable")),

      priceRange: searchParams.get("priceRange") || undefined,

      material: (() => {
        const arr = getArrayParamAll("material");
        if (arr?.length) return arr;
        return searchParams.get("material") || undefined;
      })(),

      baseColor: (() => {
        const arr = getArrayParamAll("baseColor");
        if (arr?.length) return arr;
        return searchParams.get("baseColor") || undefined;
      })(),

      limit
    };

    const result = await getAllProductsPublic(publicFilters);

    if (!result.success) {
      const status = "status" in result ? (result.status ?? 500) : 500;
      return NextResponse.json({ success: false, error: result.error }, { status });
    }

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

    const raw = (await request.json()) as unknown;
    const data = asRecord(raw);

    // Minimal safety (kept from original)
    const image = asString(data.image);
    if (!image || !image.startsWith("http")) {
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
        description: `Created product: ${asString(data.name) ?? "Unknown"}`,
        status: "success",
        metadata: {
          productId: result.data.id,
          productName: asString(data.name),
          price: asNumber(data.price)
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
    let data: Record<string, unknown> = { name: "Unknown" };
    try {
      const raw = (await request.clone().json()) as unknown;
      data = asRecord(raw);
    } catch {
      // keep fallback
    }

    // Log failed attempt (best-effort)
    try {
      const { auth } = await import("@/auth");
      const session = await auth();
      if (session?.user) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        await logActivity({
          userId: session.user.id,
          type: "create_product",
          description: `Failed to create product: ${msg}`,
          status: "error",
          metadata: {
            error: msg,
            attemptedProductName: asString(data.name) ?? "Unknown"
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
