// src/app/(auth)/login/page.tsx
import type { Metadata } from "next";
import { siteConfig } from "@/config/siteConfig";
import LoginForm from "@/components/auth/LoginForm";
import { LoginRedirect } from "@/components/auth/LoginRedirect";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthHeader } from "@/components/auth/AuthHeader";

export const metadata: Metadata = {
  title: `Sign In to Your Account | ${siteConfig.name}`,
  description:
    "Sign in to your MotoStix account to access your orders, track shipments, manage your custom sticker designs, and enjoy a personalized shopping experience.",
  keywords: [
    "login",
    "sign in",
    "account access",
    "user login",
    "motostix login",
    "customer portal",
    "account dashboard",
    "secure login",
    "member access"
  ],
  openGraph: {
    title: `Sign In to Your Account | ${siteConfig.name}`,
    description: "Access your MotoStix account to manage orders, track shipments, and enjoy personalized shopping.",
    type: "website",
    url: `${siteConfig.url}/login`,
    siteName: siteConfig.name,
    images: [
      {
        url: `${siteConfig.url}/og-auth.jpg`,
        width: 1200,
        height: 630,
        alt: "Sign in to your MotoStix account"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: `Sign In to Your Account | ${siteConfig.name}`,
    description: "Access your MotoStix account to manage orders, track shipments, and enjoy personalized shopping.",
    images: [`${siteConfig.url}/og-auth.jpg`],
    creator: "@motostix"
  },
  alternates: {
    canonical: `${siteConfig.url}/login`
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  other: {
    referrer: "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
  }
};

export default async function LoginPage() {
  const session = await auth();

  // If already signed in, don't render /login at all
  if (session?.user) {
    const role = (session.user as any)?.role;
    redirect(role === "admin" ? "/admin" : "/user");
  }
  return (
    <>
      {/* IMPORTANT: LoginRedirect should respect ?redirect=/user or ?redirect=/admin if present */}
      <LoginRedirect />

      <div className="space-y-8">
        <AuthHeader
          title="Welcome Back"
          subtitle="Sign in to your account to access your dashboard, orders, and more"
        />
        <LoginForm />
      </div>
    </>
  );
}
