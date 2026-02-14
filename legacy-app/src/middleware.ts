import { auth } from "@/auth-edge";
import { NextResponse } from "next/server";

const publicRoutes = new Set([
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/not-authorized",
  "/error",
  "/resend-verification",
  "/verify-email",
  "/verify-success",
  "/products",
  "/about",
  "/contact",
  "/privacy-policy",
  "/terms-of-service",
  "/shipping-policy",
  "/returns-policy",
  "/checkout/success"
]);

export default auth(req => {
  const path = req.nextUrl.pathname;
  const session = req.auth;

  if (path.startsWith("/api/")) return NextResponse.next();

  const isProductPage = /^\/products\/[a-zA-Z0-9-]+$/.test(path);

  if (publicRoutes.has(path) || isProductPage) return NextResponse.next();

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  if (path.startsWith("/admin") && (session.user as any)?.role !== "admin") {
    return NextResponse.redirect(new URL("/not-authorized", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|api/webhooks|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.[\\w]+$).*)"]
};
