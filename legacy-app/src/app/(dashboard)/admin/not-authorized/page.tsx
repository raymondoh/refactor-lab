import Link from "next/link";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Access Denied | MotoStix",
  description: "You don't have permission to access this page."
};

export default function NotAuthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <div className="rounded-full bg-red-100 p-6 mb-6 animate-pulse">
        <Shield className="h-12 w-12 text-red-600" />
      </div>
      <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        You don't have permission to access this page. If you believe this is an error, please contact your
        administrator.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild variant="outline">
          <Link href="/">Return Home</Link>
        </Button>
        <Button asChild>
          <Link href="/user">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
