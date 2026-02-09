// src/app/(dashboard)/layout.tsx
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { siteConfig } from "@/config/siteConfig";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { DashboardThemeProvider } from "@/providers/DashboardThemeProvider";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { headers } from "next/headers";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { isRedirectError } from "next/dist/client/components/redirect";

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

    // IMPORTANT: redirects throw NEXT_REDIRECT; do not log them as errors
    if (!session?.user) {
      redirect("/login");
    }

    const role = session.user.role;

    // Optional: infer which area the user is trying to access.
    // x-invoke-path is not guaranteed; keep it best-effort only.
    const headersList = headers();
    const pathname = headersList.get("x-invoke-path") || "";

    const isAdminRoute = pathname.includes("/admin");
    const isUserRoute = pathname.includes("/user");

    // Role-based access control
    if (role === "admin" && isUserRoute) {
      redirect("/admin");
    }
    if (role === "user" && isAdminRoute) {
      redirect("/not-authorized");
    }

    if (role !== "admin" && role !== "user") {
      redirect("/not-authorized");
    }

    const cookieStore = cookies();
    const sidebarCookie = cookieStore.get("sidebar:state");
    const sidebarState = sidebarCookie ? sidebarCookie.value === "true" : false;

    return (
      <DashboardThemeProvider>
        <SidebarProvider defaultOpen={sidebarState}>
          <div className="flex h-screen overflow-hidden w-full">
            <AppSidebar />

            <SidebarInset className="flex-1 flex flex-col w-full">
              <header className="flex h-16 items-center justify-between px-6 sticky top-0 bg-muted backdrop-blur-sm z-10 shadow-lg">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="rounded-full hover:bg-muted p-2 transition-colors" />
                  <h1 className="font-semibold text-lg hidden sm:block">
                    {role === "admin" ? "Admin Dashboard" : "My Account"}
                  </h1>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href="/"
                    className="text-sm font-medium flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronLeft className="h-4 w-4" />
                    <span>Back to Store</span>
                  </Link>
                </div>
              </header>

              <main className="flex-1 overflow-auto bg-muted/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                  <div className="bg-background rounded-xl shadow-sm border p-6">{children}</div>
                </div>
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </DashboardThemeProvider>
    );
  } catch (error) {
    // ✅ Let redirects bubble (NEXT_REDIRECT)
    if (isRedirectError(error)) throw error;

    console.error("Error in DashboardLayout:", error);
    redirect("/not-authorized");
  }
}
