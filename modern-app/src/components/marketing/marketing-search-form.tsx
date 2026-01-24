// src/components/marketing/marketing-search-form.tsx
"use client";

import { useEffect, useState, useTransition, FormEvent } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Simple debounce hook (inline so no extra import)
function useDebouncedValue<T>(value: T, delay = 450) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

interface SearchFormProps {
  initialQuery?: string;
}

export function MarketingSearchForm({ initialQuery = "" }: SearchFormProps) {
  const [query, setQuery] = useState(initialQuery);
  const debounced = useDebouncedValue(query, 450);
  const [isPending, startTransition] = useTransition();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isSearchPage = pathname === "/search";

  // Build /search URL with ?q= param
  const makeUrl = (q: string) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (q.trim()) params.set("q", q.trim());
    else params.delete("q");
    params.set("page", "1");
    const qs = params.toString();

    const basePath = "/search";
    return qs ? `${basePath}?${qs}` : basePath;
  };

  // Debounced navigation — only on /search page
  useEffect(() => {
    if (!isSearchPage) return;

    const currentQ = searchParams?.get("q") || "";
    if (debounced.trim() === currentQ.trim()) return;

    startTransition(() => {
      router.replace(makeUrl(debounced), { scroll: false });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, isSearchPage]);

  // Submit handler — runs immediately (no debounce delay)
  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      router.push(makeUrl(query));
    });
  };

  const showClear = query.length > 0;
  const typing = query !== debounced;

  return (
    <div className="max-w-2xl mx-auto px-4">
      <form
        onSubmit={handleSearch}
        role="search"
        className="flex gap-2 p-2 bg-card rounded-lg border border-border shadow-sm">
        {/* --- Input --- */}
        <div className="flex-1 flex items-center gap-2 px-3 relative">
          <Input
            type="search"
            name="q"
            aria-label="Search for plumbers or services by city"
            placeholder="Search service or plumber in city..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            autoFocus={isSearchPage}
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base pr-4 sm:pr-14 [appearance:textfield] [&::-webkit-search-cancel-button]:appearance-none"
          />
          <div className="absolute right-2 flex items-center gap-1">
            {typing && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground opacity-70" aria-hidden />}
            {showClear && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search">
                <X className="h-4 w-4 mr-2" />
              </button>
            )}
          </div>
        </div>

        {/* --- Button --- */}
        <Button
          type="submit"
          size="lg"
          className={cn("px-3 sm:px-4 md:px-8", "flex-shrink-0")}
          aria-label="Search plumbers"
          disabled={isPending}>
          {isPending ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Search className="h-5 w-5 sm:mr-2" />}
          <span className="hidden sm:inline">Search</span>
        </Button>
      </form>
    </div>
  );
}
