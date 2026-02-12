// src/app/layout.tsx
import type React from "react";
import type { Metadata } from "next";
import { siteConfig } from "@/config/siteConfig";

import { ClientLayout } from "./client-layout";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url)
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="relative min-h-screen">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
