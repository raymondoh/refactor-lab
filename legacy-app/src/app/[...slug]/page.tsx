"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, LayoutDashboard, User } from "lucide-react";

export default function NotFoundCatchAllPage() {
  const { data: session, status } = useSession();
  const role = session?.user?.role;

  return (
    <main className="min-h-screen bg-background">
      <section className="py-12 md:py-16 w-full">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 max-w-2xl mx-auto">
            {/* Icon */}
            <div className="w-20 h-20 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <AlertTriangle className="h-10 w-10 text-yellow-500 dark:text-yellow-400" />
            </div>

            {/* Heading */}
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold">Page Not Found</h1>
              <div className="w-12 h-0.5 bg-primary mx-auto" />
              <p className="text-muted-foreground max-w-md text-lg">
                The page you were looking for doesn&apos;t exist or has been moved.
              </p>
            </div>

            {/* 404 code */}
            <div className="text-8xl font-bold text-muted-foreground/20">404</div>

            {/* Buttons */}
            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild className="h-12 text-base font-semibold px-6 rounded-full">
                <Link href="/">
                  <Home className="mr-2 h-5 w-5" />
                  Go Home
                </Link>
              </Button>

              {status === "loading" ? (
                <>
                  <div className="h-12 w-48 animate-pulse rounded-full bg-muted" />
                  <div className="h-12 w-48 animate-pulse rounded-full bg-muted/60" />
                </>
              ) : (
                <>
                  {role === "admin" && (
                    <Button asChild variant="outline" className="h-12 text-base font-semibold px-6 rounded-full">
                      <Link href="/admin">
                        <LayoutDashboard className="mr-2 h-5 w-5" />
                        Admin Dashboard
                      </Link>
                    </Button>
                  )}

                  {role === "user" && (
                    <Button asChild variant="outline" className="h-12 text-base font-semibold px-6 rounded-full">
                      <Link href="/user">
                        <User className="mr-2 h-5 w-5" />
                        User Dashboard
                      </Link>
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
