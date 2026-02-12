import { type NextRequest, NextResponse } from "next/server";
import { fetchAllActivityLogs } from "@/actions/dashboard";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Number.parseInt(searchParams.get("limit") || "10", 10);

  // Update to use the correct function signature - fetchAllActivityLogs only accepts a limit parameter
  const result = await fetchAllActivityLogs(limit);

  return NextResponse.json(result);
}
