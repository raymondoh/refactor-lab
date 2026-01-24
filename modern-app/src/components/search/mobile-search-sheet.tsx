// // src/components/search/mobile-search-sheet.tsx
"use client";

import * as React from "react";
import { liteClient } from "algoliasearch/lite";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useDebouncedValue } from "@/hooks/use-debounce-search";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";

// ---------- Config ----------
const POPULAR = ["plumber london", "boiler repair", "bathroom plumbing", "emergency plumber", "leak detection"];

const RECENT_KEY = "pp_recent_searches";
const MAX_RECENT = 6;

type MobileSearchSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Lightweight recent searches storage
function useRecentSearches() {
  const [recent, setRecent] = React.useState<string[]>([]);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const add = React.useCallback((q: string) => {
    const v = q.trim();
    if (!v) return;
    setRecent(prev => {
      const next = [v, ...prev.filter(x => x.toLowerCase() !== v.toLowerCase())].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const clear = React.useCallback(() => {
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {
      // ignore
    }
    setRecent([]);
  }, []);

  return { recent, add, clear };
}

// Define the shape of the hits we expect
type AlgoliaHit = {
  id?: string;
  objectID?: string;
  name?: string;
  businessName?: string;
  citySlug?: string;
  specialties?: string[];
};

// Optional Algolia live suggestions (plumbers index)
// Uses public search key; fails gracefully if keys missing.
function useAlgoliaUserSuggestions(query: string) {
  const [hits, setHits] = React.useState<AlgoliaHit[]>([]);
  const [loading, setLoading] = React.useState(false);

  const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
  const searchKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_ONLY_KEY; // Search-only key
  const indexName = "plumbers";

  React.useEffect(() => {
    const q = query.trim();
    if (!q || !appId || !searchKey) {
      setHits([]);
      return;
    }

    let aborted = false;
    // Create an Algolia search client for lightweight queries
    const client = liteClient(appId, searchKey);

    setLoading(true);
    client
      .search<AlgoliaHit>({
        requests: [
          {
            indexName,
            query: q,
            hitsPerPage: 5,
            attributesToRetrieve: ["name", "businessName", "citySlug", "specialties"]
          }
        ]
      })
      .then(res => {
        if (aborted) return;
        const first = res.results[0];
        if (first && "hits" in first) {
          setHits(first.hits);
          return;
        }
        setHits([]);
      })
      .catch(() => {
        if (!aborted) setHits([]);
      })
      .finally(() => {
        if (!aborted) setLoading(false);
      });

    return () => {
      aborted = true;
    };
  }, [query, appId, searchKey, indexName]);

  return { hits, loading, enabled: Boolean(appId && searchKey) };
}

/**
 * Full-screen mobile search with:
 * - Debounced URL syncing to /search?q=...
 * - Recent searches (localStorage)
 * - Popular shortcuts (static)
 * - Live Algolia matches (plumbers)
 */
export function MobileSearchSheet({ open, onOpenChange }: MobileSearchSheetProps) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const initial = (sp?.get("q") ?? "").trim();
  const [query, setQuery] = React.useState(initial);
  const { debounced: debouncedValue } = useDebouncedValue(query, 350);

  const { recent, add: addRecent, clear: clearRecent } = useRecentSearches();
  const { hits, loading, enabled } = useAlgoliaUserSuggestions(debouncedValue ?? "");

  // Keep local state in sync when URL changes
  React.useEffect(() => {
    setQuery((sp?.get("q") ?? "").trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp?.get("q")]);

  // Debounced URL update while open
  React.useEffect(() => {
    if (!open) return;
    const currentQ = sp?.get("q") ?? "";
    const nextQ = (debouncedValue ?? "").trim();

    if (nextQ === currentQ.trim()) return;

    const params = new URLSearchParams(sp?.toString());
    if (nextQ) {
      params.set("q", nextQ);
      params.set("page", "1");
    } else {
      params.delete("q");
      params.delete("page");
    }

    const base = pathname.includes("/search") ? pathname : "/search";
    const url = params.toString() ? `${base}?${params.toString()}` : base;
    router.replace(url, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue, open]);

  const submitTo = React.useCallback(
    (q: string) => {
      const v = q.trim();
      const params = new URLSearchParams(sp?.toString());
      if (v) {
        params.set("q", v);
        params.set("page", "1");
      } else {
        params.delete("q");
        params.delete("page");
      }
      const url = params.toString() ? `/search?${params.toString()}` : "/search";
      router.push(url);
      if (v) addRecent(v);
      onOpenChange(false);
    },
    [addRecent, onOpenChange, router, sp]
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitTo(query);
  };

  const onClear = () => {
    setQuery("");
    const params = new URLSearchParams(sp?.toString());
    params.delete("q");
    params.delete("page");
    const url = params.toString() ? `/search?${params.toString()}` : "/search";
    router.replace(url, { scroll: false });
  };

  const onPick = (value: string) => {
    setQuery(value);
    submitTo(value);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="top" className="h-[100dvh] p-0 sm:max-w-none">
        <div className="flex h-full flex-col">
          <SheetHeader className="px-4 pt-4 pb-2">
            <SheetTitle>Search</SheetTitle>
            <SheetDescription>Find plumbers by service, skill, or city.</SheetDescription>
          </SheetHeader>

          <form onSubmit={onSubmit} className="px-4 pb-2">
            <div className="flex gap-2">
              <Input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Try “boiler repair in London”"
                className="h-12"
              />
              <Button type="submit" className="h-12 px-4">
                <Search className="mr-2 h-5 w-5" />
                Search
              </Button>
            </div>
            {query ? (
              <button
                type="button"
                onClick={onClear}
                className="mt-2 inline-flex items-center text-sm text-muted-foreground hover:underline"
                aria-label="Clear search">
                <X className="mr-1 h-4 w-4" />
                Clear
              </button>
            ) : null}
          </form>

          <div className="mt-3 border-t" />

          {/* Suggestions */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Popular */}
            <section>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Popular</h3>
              <div className="flex flex-wrap gap-2">
                {POPULAR.map(item => (
                  <button
                    key={item}
                    onClick={() => onPick(item)}
                    className="rounded-full border px-3 py-1 text-sm hover:bg-accent">
                    {item}
                  </button>
                ))}
              </div>
            </section>

            {/* Recent */}
            {recent.length > 0 && (
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground">Recent</h3>
                  <button className="text-xs text-muted-foreground hover:underline" onClick={clearRecent} type="button">
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recent.map(item => (
                    <button
                      key={item}
                      onClick={() => onPick(item)}
                      className="rounded-full bg-muted px-3 py-1 text-sm hover:bg-accent">
                      {item}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Live matches (Algolia) */}
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">Matches</h3>
                {!enabled && (
                  <span className="text-xs text-muted-foreground">
                    (Enable with NEXT_PUBLIC_ALGOLIA_APP_ID + NEXT_PUBLIC_ALGOLIA_SEARCH_ONLY_KEY)
                  </span>
                )}
              </div>

              {loading && <p className="text-sm text-muted-foreground">Searching…</p>}

              {!loading && enabled && hits.length === 0 && (debouncedValue ?? "").trim() !== "" && (
                <p className="text-sm text-muted-foreground">No matches yet.</p>
              )}

              {!loading && enabled && hits.length > 0 && (
                <ul className="divide-y rounded-md border">
                  {hits.map((h, idx) => {
                    const id = h.id ?? h.objectID ?? idx.toString();
                    const title = h.businessName || h.name || "Unnamed";
                    const subtitle = h.citySlug ? `in ${h.citySlug}` : (h.specialties?.slice?.(0, 2) || []).join(" • ");

                    return (
                      <li
                        key={id}
                        className="cursor-pointer px-3 py-2 hover:bg-accent"
                        onClick={() => onPick(`${title}`)}>
                        <div className="text-sm font-medium">{title}</div>
                        {subtitle ? <div className="text-xs text-muted-foreground">{subtitle}</div> : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          <SheetFooter className="px-4 py-3">
            <SheetClose asChild>
              <Button variant="secondary" className="w-full sm:w-auto">
                Close
              </Button>
            </SheetClose>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
