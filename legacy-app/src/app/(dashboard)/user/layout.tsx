// src/app/(dashboard)/user/layout.tsx
import type React from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { siteConfig } from "@/config/siteConfig";
import { isRedirectError } from "next/dist/client/components/redirect";

export const metadata: Metadata = {
  title: {
    template: `%s | My Account | ${siteConfig.name}`,
    default: `My Account | ${siteConfig.name}`
  },
  description:
    "Access your personal MotoStix account dashboard. View your orders, manage shipping addresses, track deliveries, and browse your custom sticker design history.",
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
    "Cache-Control": "no-cache, no-store, must-revalidate, private",
    Pragma: "no-cache",
    Expires: "0",
    "X-Permitted-Cross-Domain-Policies": "none",
    "Cross-Origin-Embedder-Policy": "require-corp"
  }
};

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();

    // If not signed in, go login (more accurate than not-authorized)
    if (!session?.user) {
      redirect("/login");
    }

    // If signed in but not a user, deny
    if (session.user.role !== "user") {
      redirect("/not-authorized");
    }

    return <div className="user-container">{children}</div>;
  } catch (error) {
    if (isRedirectError(error)) throw error;

    console.error("Error in UserLayout:", error);
    redirect("/not-authorized");
  }
}
