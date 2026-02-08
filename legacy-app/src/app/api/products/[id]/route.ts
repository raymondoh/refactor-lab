// legacy-app/src/app/api/products/[id]/route.ts
import { type NextRequest, NextResponse } from "next/server";
// ✅ PUBLIC GET
import { getProductByIdPublic } from "@/lib/services/products-public-service";

// GET - Fetch a single product by ID (PUBLIC)
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: "Product ID is required" }, { status: 400 });
    }

    // ✅ IMPORTANT: public GET should NOT call adminProductService
    const result = await getProductByIdPublic(id);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status ?? 404 });
    }

    // Maintain legacy response: { success, data: product }
    return NextResponse.json({ success: true, data: result.data.product }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/products/[id]] Uncaught error in GET handler:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch product" },
      { status: 500 }
    );
  }
}
