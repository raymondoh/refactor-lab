"use client";
import { Navbar } from "@/components/header/Navbar";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();

  const hiddenHeaderPaths = new Set([
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

  const isDashboardRoute = pathname.startsWith("/admin") || pathname.startsWith("/user");

  if (hiddenHeaderPaths.has(pathname) || isDashboardRoute) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-secondary/20 backdrop-blur">
      <div className="container px-4 mx-auto">
        <Navbar />
      </div>
    </header>
  );
}
