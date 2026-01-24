import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="text-center max-w-xl px-4">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="h-10 w-10 text-muted-foreground" />
        </div>

        {/* Heading and Description */}
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">404 – Page Not Found</h1>
        <p className="text-muted-foreground text-base mb-8">Sorry, we couldn't find the page you're looking for.</p>

        {/* Error Code */}
        <div className="text-8xl font-bold text-muted-foreground/20 mb-10">404</div>

        {/* Button */}
        <Button asChild className="h-12 px-6 text-base font-semibold rounded-full">
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    </main>
  );
}
