// src/app/api/categories/route.ts
import { NextResponse } from "next/server";
import { adminCategoryService } from "@/lib/services/admin-category-service";

export async function GET() {
  try {
    const res = await adminCategoryService.getCategories();

    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: res.status ?? 500 });
    }

    return NextResponse.json({ success: true, data: res.data.categories });
  } catch (error) {
    console.error("API error fetching categories:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch categories" }, { status: 500 });
  }
}
