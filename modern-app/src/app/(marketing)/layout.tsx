// src/app/(marketing)/layout.tsx
import React from "react";
import { Navbar } from "@/components/layout/navbar"; // Import Navbar
import { Footer } from "@/components/layout/footer";
import { getOptionalFreshSession } from "@/lib/auth/require-session"; // Import session fetcher

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  // Fetch the session data (can be null if not logged in)
  const session = await getOptionalFreshSession();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Add the Navbar here, passing the fetched session */}
      <Navbar session={session} />
      <div className="flex flex-1 flex-col">{children}</div>
      <Footer />
    </div>
  );
}
