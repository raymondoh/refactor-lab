// legacy-app/src/app/api/users/route.ts
import { NextResponse } from "next/server";
import { fetchUsers } from "@/actions/user/admin";

export const dynamic = "force-dynamic";

type Ok = { success: true; users: unknown; total?: number };
type Err = { success: false; error: string };

export async function GET() {
  try {
    const result = await fetchUsers(100, 0);

    if (!result.success) {
      const msg = result.error || "Failed to fetch users";

      // Map common auth errors to correct HTTP codes
      const status = msg.toLowerCase().includes("not authenticated")
        ? 401
        : msg.toLowerCase().includes("unauthorized")
          ? 403
          : 400;

      return NextResponse.json<Err>({ success: false, error: msg }, { status });
    }

    // IMPORTANT: fetchUsers already returns serialized users in your implementation.
    return NextResponse.json<Ok>({ success: true, users: result.users, total: result.total }, { status: 200 });
  } catch (err: unknown) {
    console.error("[api/users] GET error:", err);
    return NextResponse.json<Err>({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
