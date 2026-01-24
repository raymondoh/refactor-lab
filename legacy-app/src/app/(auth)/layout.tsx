"use client";

import type React from "react";
import { ThemeProvider } from "@/providers/ThemeProvider";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <main className="min-h-screen bg-background text-foreground transition-colors duration-300">
        <section className="py-12 md:py-16 w-full">
          <div className="container mx-auto px-4">
            <div className="w-full max-w-md mx-auto rounded-xl p-8 md:p-10 bg-background text-foreground shadow-sm transition-colors duration-300">
              {children}
            </div>
          </div>
        </section>
      </main>
    </ThemeProvider>
  );
}
