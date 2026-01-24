import { type NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/services/storage-service";

export async function POST(request: NextRequest) {
  try {
    console.log("Upload API route called");

    // Dynamic import to avoid build-time initialization
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Use the storage service
    const result = await uploadFile({
      file,
      userId: session.user.id,
      userRole: session.user.role || "user"
    });

    if (result.success) {
      return NextResponse.json({ url: result.url });
    } else {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
  } catch (error) {
    console.error("Upload route error:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ error: "Unknown upload error" }, { status: 500 });
  }
}
