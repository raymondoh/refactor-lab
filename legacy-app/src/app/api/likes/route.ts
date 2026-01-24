import { NextResponse } from "next/server";
import { getUserLikedProducts, likeProduct, unlikeProduct } from "@/firebase/admin/products";

export async function GET() {
  try {
    // Dynamic import to avoid build-time initialization
    const { auth } = await import("@/auth");
    const session = await auth();

    // Check if session and user exist
    if (!session || !session.user || !session.user.id) {
      console.log("[GET /api/likes] No valid session or user ID");
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          likedProductIds: [] // Always include this to avoid parsing errors
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    console.log("[GET /api/likes] User ID:", userId);

    // Get all liked products for the user
    const result = await getUserLikedProducts(userId);

    if (!result.success) {
      console.error("[GET /api/likes] Error from getUserLikedProducts:", result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          likedProductIds: [] // Always include this to avoid parsing errors
        },
        { status: 500 }
      );
    }

    // Extract just the product IDs for the client
    const likedProductIds = result.data.map(product => product.id);
    console.log(`[GET /api/likes] Found ${likedProductIds.length} liked products for user ${userId}`);

    return NextResponse.json({
      success: true,
      likedProductIds
    });
  } catch (error) {
    console.error("[GET /api/likes] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch likes",
        likedProductIds: [] // Always include this to avoid parsing errors
      },
      { status: 500 }
    );
  }
}

// POST and DELETE handlers remain the same
export async function POST(request: Request) {
  try {
    // Dynamic import to avoid build-time initialization
    const { auth } = await import("@/auth");
    const session = await auth();

    // Check if session and user exist
    if (!session || !session.user || !session.user.id) {
      console.log("[POST /api/likes] No valid session or user ID");
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log("[POST /api/likes] User ID:", userId, "Type:", typeof userId, "Length:", userId.length);

    // Parse the request body
    const body = await request.json();
    const { productId } = body;

    console.log("[POST /api/likes] Product ID:", productId, "Type:", typeof productId, "Length:", productId?.length);

    if (!productId) {
      console.log("[POST /api/likes] No productId in request body");
      return NextResponse.json({ success: false, error: "Product ID is required" }, { status: 400 });
    }

    // Validate IDs
    if (typeof userId !== "string" || userId.trim() === "") {
      console.error("[POST /api/likes] Invalid userId:", userId);
      return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 });
    }

    if (typeof productId !== "string" || productId.trim() === "") {
      console.error("[POST /api/likes] Invalid productId:", productId);
      return NextResponse.json({ success: false, error: "Invalid product ID" }, { status: 400 });
    }

    console.log(`[POST /api/likes] Liking product ${productId} for user ${userId}`);

    // Like the product using your Firebase function
    const result = await likeProduct(userId, productId);

    if (!result.success) {
      console.error("[POST /api/likes] Error from likeProduct:", result.error);
      throw new Error(result.error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/likes] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to add like"
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    // Dynamic import to avoid build-time initialization
    const { auth } = await import("@/auth");
    const session = await auth();

    // Check if session and user exist
    if (!session || !session.user || !session.user.id) {
      console.log("[DELETE /api/likes] No valid session or user ID");
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log("[DELETE /api/likes] User ID:", userId);

    // Parse the request body
    const body = await request.json();
    const { productId } = body;

    console.log("[DELETE /api/likes] Request body:", body);

    if (!productId) {
      console.log("[DELETE /api/likes] No productId in request body");
      return NextResponse.json({ success: false, error: "Product ID is required" }, { status: 400 });
    }

    console.log(`[DELETE /api/likes] Unliking product ${productId} for user ${userId}`);

    // Unlike the product using your Firebase function
    const result = await unlikeProduct(userId, productId);

    if (!result.success) {
      console.error("[DELETE /api/likes] Error from unlikeProduct:", result.error);
      throw new Error(result.error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/likes] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to remove like"
      },
      { status: 500 }
    );
  }
}
