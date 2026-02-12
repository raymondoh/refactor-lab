// src/app/(root)/layout.tsx
import type React from "react";
import { Header, FooterWrapper } from "@/components";

export default function RootSiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
      <FooterWrapper />
    </div>
  );
}
