"use client";
import { usePathname } from "next/navigation";
import { Footer } from "./Footer";

export function FooterWrapper() {
  const pathname = usePathname();

  // Define paths where the footer should be completely hidden
  // Keep this in sync with the same list in Header.tsx yes
  const hiddenFooterPaths = new Set([
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/not-authorized",
    "/error",
    "/resend-verification",
    "/verify-email",
    "/verify-success"
  ]);

  // Don't render any footer on auth pages
  if (hiddenFooterPaths.has(pathname)) {
    return null;
  }

  // Render the full footer on all other pages
  return <Footer />;
}
