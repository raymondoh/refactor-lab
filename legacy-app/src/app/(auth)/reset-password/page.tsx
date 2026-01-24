import type { Metadata } from "next";
import { siteConfig } from "@/config/siteConfig";
import { ResetPasswordForm } from "@/components";
import { AuthHeader } from "@/components/auth/AuthHeader";

export const metadata: Metadata = {
  title: `Reset Your Password | ${siteConfig.name}`,
  description:
    "Create a new secure password for your MotoStix account. Enter your new password below to regain access to your account and continue shopping for custom stickers.",
  keywords: [
    "reset password",
    "new password",
    "password change",
    "account recovery",
    "secure password",
    "password update",
    "motostix password",
    "account access",
    "password confirmation"
  ],

  openGraph: {
    title: `Reset Your Password | ${siteConfig.name}`,
    description: "Create a new secure password for your MotoStix account and regain access to your orders.",
    type: "website",
    url: `${siteConfig.url}/reset-password`,
    siteName: siteConfig.name,
    images: [
      {
        url: "/og-auth.jpg",
        width: 1200,
        height: 630,
        alt: "Reset your password securely - MotoStix"
      }
    ]
  },

  twitter: {
    card: "summary_large_image",
    title: `Reset Your Password | ${siteConfig.name}`,
    description: "Create a new secure password for your MotoStix account and regain access to your orders.",
    images: ["/og-auth.jpg"],
    creator: "@motostix"
  },

  alternates: {
    canonical: `${siteConfig.url}/reset-password`
  },

  robots: {
    index: false, // Don't index - this page requires a token and is user-specific
    follow: false,
    noarchive: true,
    googleBot: {
      index: false,
      follow: false,
      noarchive: true,
      nosnippet: true
    }
  },

  other: {
    referrer: "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "cache-control": "no-cache, no-store, must-revalidate" // Don't cache password reset pages
  }
};

export default function ResetPasswordPage() {
  return (
    <>
      <AuthHeader
        title="Reset Your Password"
        subtitle="Create a new secure password for your account. Make sure it's at least 8 characters long."
      />
      <div className="mt-8">
        <ResetPasswordForm />
      </div>
    </>
  );
}
