// src/app/(legal)/layout.tsx
import React from "react";
import { Navbar } from "@/components/layout/navbar"; // Import Navbar
import { Footer } from "@/components/layout/footer";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { getOptionalFreshSession } from "@/lib/auth/require-session"; // Import session fetcher

export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  // Fetch the session data (can be null if not logged in)
  const session = await getOptionalFreshSession();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Add the Navbar here, passing the fetched session */}
      <Navbar session={session} />
      <main className="flex flex-1 flex-col">
        {/* MarketingHeader renders breadcrumbs based on path */}
        <MarketingHeader />
        <div className="flex-1">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
