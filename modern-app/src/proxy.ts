// src/proxy.ts
import { NextResponse, type NextRequest } from "next/server";

export default function proxy(req: NextRequest) {
  const maintenance = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";
  const p = req.nextUrl.pathname;

  if (!maintenance) return NextResponse.next();

  // Allow-only internals / health / maintenance page / static
  const allow =
    p.startsWith("/_next") ||
    p.startsWith("/assets") ||
    p.startsWith("/favicon") ||
    p.startsWith("/maintenance") ||
    p.startsWith("/api/health");

  if (allow) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/maintenance";
  url.search = "";
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!api/health).*)"]
};
