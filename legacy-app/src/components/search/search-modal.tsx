// src/components/search/search-modal.tsx
"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { X, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSearch } from "@/contexts/SearchContext";
import { cn } from "@/lib/utils";

export function SearchModal() {
  const {
    query,
    results,
    isSearching,
    isOpen,
    selectedIndex,
    setQuery,
    clearSearch,
    closeSearch,
    selectNextResult,
    selectPrevResult,
    navigateToSelected, // This is for navigating to a specific selected result
    selectResult,
    navigateToResult // This is for navigating to a specific result on click
  } = useSearch();

  const inputRef = useRef<HTMLInputElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Console logs for debugging the modal state
  useEffect(() => {
    console.log("SearchModal state:", {
      query,
      resultsCount: results.length,
      isSearching,
      isOpen,
      selectedIndex // Added selectedIndex for better debugging
    });

    if (results.length > 0) {
      console.log("First few search results:", results.slice(0, 3));
    }
  }, [query, results, isSearching, isOpen, selectedIndex]); // Added selectedIndex to dependencies

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && selectedRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }
  }, [selectedIndex]);

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        selectNextResult();
        break;
      case "ArrowUp":
        e.preventDefault();
        selectPrevResult();
        break;
      case "Enter":
        e.preventDefault(); // Prevent default form submission if any
        if (selectedIndex >= 0 && results[selectedIndex]) {
          // If a result is selected/highlighted, navigate to its detail page
          navigateToSelected();
        } else if (query.trim()) {
          // NEW LOGIC: If no result is selected but there's a query, perform a broad search
          closeSearch(); // Close the modal
          router.push(`/products?q=${encodeURIComponent(query.trim())}`); // Redirect to products page
        }
        break;
      case "Escape":
        e.preventDefault();
        closeSearch();
        break;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={closeSearch}>
      <DialogContent className="sm:max-w-[550px] p-0">
        <DialogTitle className="sr-only">Search</DialogTitle>

        <div className="flex items-center border-b p-4">
          {/* <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" /> */}
          <Input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search for anything..."
            className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {query && (
            <Button variant="ghost" size="sm" onClick={clearSearch} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
              <span className="sr-only">Clear</span>
            </Button>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-0">
          {isSearching ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => (
                <div
                  key={result.id}
                  ref={index === selectedIndex ? selectedRef : null}
                  className={cn(
                    "px-4 py-2 cursor-pointer",
                    index === selectedIndex ? "bg-primary/10" : "hover:bg-muted/50"
                  )}
                  onClick={() => navigateToResult(result)}
                  onMouseEnter={() => selectResult(index)}>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-medium">
                        {result.name?.charAt(0) || result.title?.charAt(0) || "#"}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium">{result.name || result.title}</h3>
                      {result.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{result.description}</p>
                      )}
                      {result.email && !result.description && (
                        <p className="text-xs text-muted-foreground">{result.email}</p>
                      )}
                      {result.type && (
                        <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground mt-1">
                          {result.type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : query ? (
            <div className="px-4 py-12 text-center">
              <p className="text-sm text-muted-foreground">No results found</p>
              {/* NEW: Suggest broad search if no specific results found */}
              <Button
                variant="link"
                className="mt-2"
                onClick={() => {
                  closeSearch();
                  router.push(`/products?q=${encodeURIComponent(query.trim())}`);
                }}>
                Search all products for "{query}"
              </Button>
            </div>
          ) : (
            <div className="px-4 py-12 text-center">
              <p className="text-sm text-muted-foreground">Type to start searching...</p>
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>{results.length} results</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <ArrowUp className="h-3 w-3" /> <ArrowDown className="h-3 w-3" />
                to navigate
              </span>
              <span className="flex items-center gap-1">
                <span className="rounded border px-1">Enter</span> to select
              </span>
              <span className="flex items-center gap-1">
                <span className="rounded border px-1">Esc</span> to close
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
