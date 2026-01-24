// src/app/(dashboard)/admin/layout.tsx
import type React from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { siteConfig } from "@/config/siteConfig";

export const metadata: Metadata = {
  // Admin-specific title template
  title: {
    template: `%s | Admin Panel | ${siteConfig.name}`,
    default: `Admin Panel | ${siteConfig.name}`
  },

  // Admin dashboard description
  description:
    "MotoStix administrative dashboard. Manage products, orders, users, analytics, and system settings. Restricted access for authorized administrators only.",

  // Admin-specific keywords
  keywords: [
    "admin panel",
    "admin dashboard",
    "motostix admin",
    "product management",
    "order management",
    "user management",
    "analytics dashboard",
    "system administration",
    "admin portal",
    "backend management"
  ],
  // Strictest privacy settings - absolutely no indexing
  robots: {
    index: false,
    follow: false, // This correctly handles "nofollow"
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noarchive: true,
      nosnippet: true,
      noimageindex: true,
      nocache: true
    }
  },

  // Maximum security headers for admin pages
  other: {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "Referrer-Policy": "no-referrer", // Strictest referrer policy
    "Cache-Control": "no-cache, no-store, must-revalidate, private, max-age=0",
    Pragma: "no-cache",
    Expires: "0",

    // Enhanced admin security
    "X-Permitted-Cross-Domain-Policies": "none",
    "Cross-Origin-Embedder-Policy": "require-corp",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",

    // Content Security Policy for admin
    "Content-Security-Policy":
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self'; " +
      "connect-src 'self'; " +
      "frame-ancestors 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self';",

    // Additional admin protection
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "X-XSS-Protection": "1; mode=block"
  }
};

// This layout uses auth() or headers(), so force dynamic rendering
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    // Dynamic import to avoid build-time initialization
    const { auth } = await import("@/auth");
    const session = await auth();

    // Check if user is logged in and is an admin
    if (!session?.user || session.user.role !== "admin") {
      redirect("/not-authorized");
    }

    return <div className="admin-container">{children}</div>;
  } catch (error) {
    console.error("Error in AdminLayout:", error);
    redirect("/not-authorized");
  }
}
