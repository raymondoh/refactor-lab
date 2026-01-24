import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require authentication
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
  // 1. Add the Stripe success page to the public routes.
  // This allows users to be redirected here from Stripe without being blocked.
  "/checkout/success"
]);

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Use a regex to check for dynamic product pages like /products/some-id
  const isProductPage = /^\/products\/[a-zA-Z0-9-]+$/.test(path);

  // If the path is public OR it's a dynamic product page, allow the request.
  if (publicRoutes.has(path) || isProductPage) {
    return NextResponse.next();
  }

  // --- Your future protection logic would go here ---
  // For example, checking for a valid session token for /admin or /user routes.
  // If the check fails, you would redirect to login:
  //
  // const session = await auth(); // Example using next-auth
  // if (!session) {
  //   return NextResponse.redirect(new URL('/login', request.url));
  // }
  // ---------------------------------------------------

  if (process.env.NODE_ENV === "development") {
    console.log(`Middleware - Path accessed: ${path}`);
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Match all request paths except for the ones starting with:
   * - api/auth (NextAuth's own API routes)
   * - api/webhooks/stripe (Stripe's webhook, must be public)
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - images (your static images folder)
   * - favicon.ico (favicon file)
   */
  matcher: ["/((?!api/auth|api/webhooks/stripe|_next/static|_next/image|images|favicon.ico).*)"]
};
