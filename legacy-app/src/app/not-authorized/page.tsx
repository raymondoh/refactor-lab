import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Home, LogIn } from "lucide-react";

export default function NotAuthorizedPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="py-12 md:py-16 w-full">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center max-w-2xl mx-auto space-y-6">
            {/* Icon */}
            <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <ShieldAlert className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>

            {/* Heading */}
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold">Access Denied</h1>
              <div className="w-12 h-0.5 bg-primary mx-auto" />
              <p className="text-muted-foreground max-w-md text-lg">
                You don't have permission to access this page. Please contact an administrator if you believe this is an
                error.
              </p>
            </div>

            {/* 403 Code */}
            <div className="text-8xl font-bold text-muted-foreground/20">403</div>

            {/* Actions */}
            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild variant="outline" className="h-12 text-base font-semibold px-6 rounded-full">
                <Link href="/">
                  <Home className="mr-2 h-5 w-5" />
                  Return Home
                </Link>
              </Button>

              <Button asChild className="h-12 text-base font-semibold px-6 rounded-full">
                <Link href="/login">
                  <LogIn className="mr-2 h-5 w-5" />
                  Sign In
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
