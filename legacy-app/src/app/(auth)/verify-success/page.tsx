import type { Metadata } from "next";
import { siteConfig } from "@/config/siteConfig";
import { VerificationSuccessForm } from "@/components";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: `Email Verified Successfully | ${siteConfig.name}`,
  description:
    "Congratulations! Your email has been successfully verified and your MotoStix account is now fully activated. Start exploring our custom sticker collections and exclusive designs.",
  keywords: [
    "email verified",
    "verification successful",
    "account activated",
    "email confirmed",
    "verification complete",
    "account ready",
    "motostix account",
    "start shopping",
    "successful verification"
  ],

  openGraph: {
    title: `Email Verified Successfully | ${siteConfig.name}`,
    description: "Your account is now active! Start exploring our custom sticker collections and exclusive designs.",
    type: "website",
    url: `${siteConfig.url}/verify-success`,
    siteName: siteConfig.name,
    images: [
      {
        url: "/og-auth-success.jpg", // Consider a special "success" image
        width: 1200,
        height: 630,
        alt: "Email verification successful - MotoStix"
      }
    ]
  },

  twitter: {
    card: "summary_large_image",
    title: `Email Verified Successfully | ${siteConfig.name}`,
    description: "Your account is now active! Start exploring our custom sticker collections and exclusive designs.",
    images: ["/og-auth-success.jpg"],
    creator: "@motostix"
  },

  alternates: {
    canonical: `${siteConfig.url}/verify-success`
  },

  robots: {
    index: false, // Don't index - this is a transient success page
    follow: true, // But allow following links from this page
    noarchive: true,
    googleBot: {
      index: false,
      follow: true,
      noarchive: true,
      nosnippet: true
    }
  },

  other: {
    referrer: "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    refresh: "5;url=/" // Optional: Auto-redirect to homepage after 5 seconds
  }
};

export default function VerifySuccessPage() {
  return (
    <>
      <div className="flex flex-col items-center mb-6">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
      </div>

      <AuthHeader
        title="Email Verified!"
        subtitle="Your account has been successfully verified. You now have full access to all MotoStix features and services."
      />

      <div className="mt-8">
        <VerificationSuccessForm />
      </div>
    </>
  );
}
