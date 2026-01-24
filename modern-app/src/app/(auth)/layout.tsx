// src/app/(auth)/layout.tsx
import type React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md relative">
        <Link href="/" className="absolute top-4 right-4 z-10" aria-label="Go to homepage">
          <Button variant="ghost" size="icon">
            <X className="h-5 w-5 text-muted-foreground" />
          </Button>
        </Link>
        {children}
      </div>
    </div>
  );
}
