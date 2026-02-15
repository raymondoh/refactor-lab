// src/app/api/categories/featured/route.ts
import { NextResponse } from "next/server";
import { adminCategoryService } from "@/lib/services/admin-category-service";

export async function GET() {
  try {
    const res = await adminCategoryService.getFeaturedCategories();

    if (!res.ok) {
      return NextResponse.json({ success: false, error: res.error }, { status: res.status ?? 500 });
    }

    return NextResponse.json({
      success: true,
      data: res.data.featuredCategories
    });
  } catch (error) {
    console.error("API error fetching featured categories:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch featured categories" }, { status: 500 });
  }
}
