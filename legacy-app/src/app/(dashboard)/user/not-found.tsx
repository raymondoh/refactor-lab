import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export default function UserNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 text-center">
      <ShieldAlert className="h-12 w-12 text-destructive mb-4" />
      <h1 className="text-2xl font-semibold">User Page Not Found</h1>
      <p className="text-muted-foreground mb-4">The page you were trying to access doesn’t exist or is unavailable.</p>
      <div className="flex gap-4">
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
