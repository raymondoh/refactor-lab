import { type NextRequest, NextResponse } from "next/server";
import { getAllProductsPublic } from "@/lib/services/products-public-service";
import { adminProductService } from "@/lib/services/admin-product-service";

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
      const status: number = "status" in result && typeof result.status === "number" ? result.status : 500;
      return NextResponse.json({ success: false, error: result.error }, { status });
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 200 });
  } catch (error) {
    console.error("Error in /api/products:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch products" }, { status: 500 });
  }
}

// src/app/api/products/route.ts
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // The service now handles requireAdmin() and logActivity() internally
    const result = await adminProductService.addProduct(data);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status ?? 400 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("[POST /api/products]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
