// src/app/api/categories/route.ts
import { NextResponse } from "next/server";
import { getCategories } from "@/firebase/admin/categories";

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error("API error fetching categories:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch categories" }, { status: 500 });
  }
}
