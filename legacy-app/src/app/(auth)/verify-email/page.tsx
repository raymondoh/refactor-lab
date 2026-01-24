import type { Metadata } from "next";
import { siteConfig } from "@/config/siteConfig";
import { VerifyEmailForm } from "@/components";
import { AuthHeader } from "@/components/auth/AuthHeader";

export const metadata: Metadata = {
  title: `Verify Your Email | ${siteConfig.name}`,
  description:
    "Complete your MotoStix account setup by verifying your email address. Click the verification link in your email or enter your verification code to activate your account.",
  keywords: [
    "verify email",
    "email verification",
    "account verification",
    "activate account",
    "email confirmation",
    "verification code",
    "account setup",
    "motostix verification",
    "confirm email address"
  ],

  openGraph: {
    title: `Verify Your Email | ${siteConfig.name}`,
    description: "Complete your account setup by verifying your email address and start shopping for custom stickers.",
    type: "website",
    url: `${siteConfig.url}/verify-email`,
    siteName: siteConfig.name,
    images: [
      {
        url: "/og-auth.jpg",
        width: 1200,
        height: 630,
        alt: "Verify your email address - MotoStix"
      }
    ]
  },

  twitter: {
    card: "summary_large_image",
    title: `Verify Your Email | ${siteConfig.name}`,
    description: "Complete your account setup by verifying your email address and start shopping for custom stickers.",
    images: ["/og-auth.jpg"],
    creator: "@motostix"
  },

  alternates: {
    canonical: `${siteConfig.url}/verify-email`
  },

  robots: {
    index: false, // Don't index - this page requires a specific token
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
    "cache-control": "no-cache, no-store, must-revalidate" // Don't cache verification pages
  }
};

export default function VerifyEmailPage() {
  return (
    <>
      <AuthHeader
        title="Verify Your Email"
        subtitle="We've sent a verification code to your email address. Please check your inbox and enter the code below to complete your account setup."
      />
      <div className="mt-8">
        <VerifyEmailForm />
      </div>
    </>
  );
}
