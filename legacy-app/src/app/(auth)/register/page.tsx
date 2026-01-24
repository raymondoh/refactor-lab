import type { Metadata } from "next";
import { siteConfig } from "@/config/siteConfig";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { LoginRedirect } from "@/components/auth/LoginRedirect";
import { AuthHeader } from "@/components/auth/AuthHeader";

export const metadata: Metadata = {
  title: `Create Your Account | ${siteConfig.name}`,
  description:
    "Join MotoStix today! Create your free account to access exclusive custom sticker designs, track your orders, save your favorites, and enjoy faster checkout with personalized recommendations.",
  keywords: [
    "register",
    "sign up",
    "create account",
    "join motostix",
    "new account",
    "customer registration",
    "free account",
    "member signup",
    "custom stickers account",
    "motostix membership"
  ],

  openGraph: {
    title: `Create Your Account | ${siteConfig.name}`,
    description:
      "Join MotoStix today! Create your free account for exclusive designs, order tracking, and personalized shopping.",
    type: "website",
    url: `${siteConfig.url}/register`,
    siteName: siteConfig.name,
    images: [
      {
        url: "/og-auth.jpg", // Same auth image for consistency
        width: 1200,
        height: 630,
        alt: "Create your free MotoStix account today"
      }
    ]
  },

  twitter: {
    card: "summary_large_image",
    title: `Create Your Account | ${siteConfig.name}`,
    description:
      "Join MotoStix today! Create your free account for exclusive designs, order tracking, and personalized shopping.",
    images: ["/og-auth.jpg"],
    creator: "@motostix" // Replace with your actual Twitter handle
  },

  alternates: {
    canonical: `${siteConfig.url}/register`
  },

  robots: {
    index: true, // Allow indexing - people search for "sign up [brand]"
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },

  // Security headers for auth pages
  other: {
    referrer: "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY", // Prevent clickjacking attacks
    "X-Content-Type-Options": "nosniff",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()" // Restrict permissions
  }
};

export default function RegisterPage() {
  return (
    <>
      <LoginRedirect />
      <AuthHeader title="Create Account" subtitle="Join MotoStix to access exclusive designs and track your orders" />
      <div className="mt-8">
        <RegisterForm />
      </div>
    </>
  );
}
