// src/app/(root)/search/page.tsx
"use client";

import { useEffect, Suspense } from "react"; // Import Suspense
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

// This component will handle the redirection logic
function SearchPageRedirector() {
  const router = useRouter();
  const searchParams = useSearchParams(); // Hook to access URL search parameters
  const searchQuery = searchParams.get("q"); // Get the 'q' parameter from the URL

  useEffect(() => {
    if (searchQuery) {
      // If a search query exists, redirect to the products page with the query
      router.replace(`/products?q=${encodeURIComponent(searchQuery)}`);
    } else {
      // If no search query is provided, redirect to the main products page
      router.replace("/products");
    }
  }, [searchQuery, router]);

  // Display a loading indicator while redirecting
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Search</h1>
      <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4 text-center text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-lg">Redirecting to products...</p>
      </div>
    </div>
  );
}

// Export the default component, wrapping SearchPageRedirector in Suspense
export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-6">Search</h1>
          <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4 text-center text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-lg">Preparing search redirection...</p> {/* A fallback message for Suspense */}
          </div>
        </div>
      }>
      <SearchPageRedirector />
    </Suspense>
  );
}
