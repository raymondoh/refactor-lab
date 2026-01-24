import type React from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { siteConfig } from "@/config/siteConfig";

export const metadata: Metadata = {
  // User-specific title template
  title: {
    template: `%s | My Account | ${siteConfig.name}`,
    default: `My Account | ${siteConfig.name}`
  },

  // User dashboard description
  description:
    "Access your personal MotoStix account dashboard. View your orders, manage shipping addresses, track deliveries, and browse your custom sticker design history.",

  // User-specific keywords
  keywords: [
    "my account",
    "user dashboard",
    "my orders",
    "order history",
    "shipping address",
    "account settings",
    "profile settings",
    "order tracking",
    "my designs",
    "customer account",
    "motostix account"
  ],

  // Inherit strict privacy from parent dashboard layout
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

  // User-specific security headers
  other: {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Cache-Control": "no-cache, no-store, must-revalidate, private", // Extra 'private' for user data
    Pragma: "no-cache",
    Expires: "0",
    // Additional user data protection
    "X-Permitted-Cross-Domain-Policies": "none",
    "Cross-Origin-Embedder-Policy": "require-corp"
  }
};

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  try {
    // Dynamic import to avoid build-time initialization
    const { auth } = await import("@/auth");
    const session = await auth();

    // Check if they have the user role
    if (!session || session.user.role !== "user") {
      redirect("/not-authorized");
    }

    return <div className="user-container">{children}</div>;
  } catch (error) {
    console.error("Error in UserLayout:", error);
    redirect("/not-authorized");
  }
}
