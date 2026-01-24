"use client";
import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <FileQuestion className="mx-auto h-16 w-16 text-muted-foreground" />
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          404 - Page Not Found!! dashboard0not found
        </h1>
        <p className="mt-4 text-base text-muted-foreground">Sorry, we couldn't find the page you're looking for.</p>
        <div className="mt-10">
          <Button asChild>
            <Link href="/admin">Go back home dashboard not-found</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
