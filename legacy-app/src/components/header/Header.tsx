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

  if (hiddenHeaderPaths.has(pathname)) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-background text-foreground shadow-md">
      <div className="container px-4 mx-auto">
        <Navbar />
      </div>
    </header>
  );
}
