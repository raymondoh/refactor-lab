// src/app/api/products/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { getAllProductsPublic } from "@/lib/services/products-public-service";
import { adminProductService } from "@/lib/services/admin-product-service";
import { requireAdmin } from "@/actions/_helpers/require-admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const getBooleanParam = (param: string | null): boolean | undefined => {
      if (param === null) return undefined;
      return param === "true";
    };

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
