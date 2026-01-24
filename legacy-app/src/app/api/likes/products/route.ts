import { NextResponse } from "next/server";
import { getUserLikedProducts } from "@/firebase/admin/products";

export async function GET() {
  try {
    // Dynamic import to avoid build-time initialization
    const { auth } = await import("@/auth");

    // Get the session using auth()
    const session = await auth();

    // Check if session and user exist
    if (!session || !session.user || !session.user.id) {
      console.log("[GET /api/likes/products] No valid session or user ID");
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          products: [] // Always include this to avoid parsing errors
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    console.log("[GET /api/likes/products] User ID:", userId);

    // Get all liked products for the user
    const result = await getUserLikedProducts(userId);

    if (!result.success) {
      console.error("[GET /api/likes/products] Error from getUserLikedProducts:", result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          products: [] // Always include this to avoid parsing errors
        },
        { status: 500 }
      );
    }

    console.log(`[GET /api/likes/products] Found ${result.data.length} liked products for user ${userId}`);

    return NextResponse.json({
      success: true,
      products: result.data
    });
  } catch (error) {
    console.error("[GET /api/likes/products] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch liked products",
        products: [] // Always include this to avoid parsing errors
      },
      { status: 500 }
    );
  }
}
