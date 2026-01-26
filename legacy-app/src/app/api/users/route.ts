// legacy-app/src/app/api/users/route.ts
import { NextResponse } from "next/server";
import { fetchUsers } from "@/actions/user/admin";

export async function GET() {
  const result = await fetchUsers(100, 0);

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 500 } // (optional: map auth/unauthorized later if you add status codes)
    );
  }

  console.log("[fetchUsers]", { users: result.users?.length ?? 0, total: result.total ?? 0 });

  return NextResponse.json({ success: true, users: result.users ?? [], total: result.total ?? 0 }, { status: 200 });
}
