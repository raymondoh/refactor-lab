// src/app/api/categories/featured/route.ts
import { NextResponse } from "next/server";
import { getFeaturedCategories } from "@/firebase/admin/categories";

export async function GET() {
  try {
    const categories = await getFeaturedCategories();
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error("API error fetching featured categories:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch featured categories" }, { status: 500 });
  }
}
