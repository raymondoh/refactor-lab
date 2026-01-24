// /app/api/admin/users/route.ts

import { fetchUsers } from "@/actions/user/admin";
import { serializeUserArray } from "@/utils/serializeUser";
import { NextResponse } from "next/server";

export async function GET() {
  const result = await fetchUsers(100, 0); // increase limit if needed

  if (!result.success || !result.users) {
    return NextResponse.json({ success: false, error: result.error || "Failed to fetch users" }, { status: 500 });
  }

  const serialized = serializeUserArray(result.users);
  return NextResponse.json({ success: true, users: serialized });
}
