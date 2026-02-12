// src/app/(dashboard)/layout.tsx
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { siteConfig } from "@/config/siteConfig";
import { redirect, unstable_rethrow } from "next/navigation";

import { cookies } from "next/headers";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { DashboardThemeProvider } from "@/providers/DashboardThemeProvider";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { headers } from "next/headers";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    template: `%s | Dashboard | ${siteConfig.name}`,
    default: `Dashboard | ${siteConfig.name}`
  },
  description:
    "Manage your MotoStix account, view orders, track shipments, and access your custom sticker designs from your personal dashboard.",
  keywords: [
    "motostix dashboard",
    "account management",
    "order tracking",
    "user dashboard",
    "account settings",
    "order history",
    "custom designs",
    "user portal",
    "account overview"
  ],
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noarchive: true,
      nosnippet: true,
      noimageindex: true
    }
  },
  other: {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    "Content-Security-Policy": "frame-ancestors 'none';"
  }
};

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user) redirect("/login");

    const role = session.user.role;

    const headersList = await headers();
    const pathname = headersList.get("x-invoke-path") || "";

    const isAdminRoute = pathname.includes("/admin");
    const isUserRoute = pathname.includes("/user");

    if (role === "admin" && isUserRoute) redirect("/admin");
    if (role === "user" && isAdminRoute) redirect("/not-authorized");
    if (role !== "admin" && role !== "user") redirect("/not-authorized");

    const cookieStore = await cookies();
    const sidebarCookie = cookieStore.get("sidebar:state");
    const sidebarState = sidebarCookie ? sidebarCookie.value === "true" : false;

    return (
      <DashboardThemeProvider>
        <SidebarProvider defaultOpen={sidebarState}>
          <div className="flex min-h-svh w-full bg-background">
            <AppSidebar />

            <SidebarInset className="min-w-0 flex-1">
              <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-border/60 bg-muted/80 px-4 backdrop-blur-sm sm:px-6">
                <div className="flex items-center gap-2">
                  {/* ✅ matches shadcn positioning so it doesn’t feel “pushed in” */}
                  <SidebarTrigger className="-ml-1" />
                  <h1 className="hidden text-lg font-semibold sm:block">
                    {role === "admin" ? "Admin Dashboard" : "My Account"}
                  </h1>
                </div>

                <Link
                  href="/"
                  className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                  <ChevronLeft className="h-4 w-4" />
                  <span>Back to Store</span>
                </Link>
              </header>

              <main className="flex-1 overflow-auto">
                <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
                  <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">{children}</div>
                </div>
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </DashboardThemeProvider>
    );
  } catch (error: unknown) {
    unstable_rethrow(error);
    console.error("Error in DashboardLayout:", error);
    redirect("/not-authorized");
  }
}
