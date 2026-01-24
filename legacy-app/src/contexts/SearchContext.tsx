"use client";

import { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import Fuse, { type IFuseOptions } from "fuse.js"; // Keep this import as is

export interface SearchResult {
  id: string;
  [key: string]: any;
}

interface SearchContextType {
  // Search state
  query: string;
  results: SearchResult[];
  isSearching: boolean;
  isOpen: boolean;
  selectedIndex: number;

  // Search actions
  setQuery: (query: string) => void;
  clearSearch: () => void;
  openSearch: () => void;
  closeSearch: () => void;

  // Navigation
  selectNextResult: () => void;
  selectPrevResult: () => void;
  selectResult: (index: number) => void;
  navigateToSelected: () => void;
  navigateToResult: (r: SearchResult) => void;

  // Data management
  // Corrected line:
  setSearchableData: (data: SearchResult[], options?: IFuseOptions<SearchResult>) => void;
}

const SearchContext = createContext<SearchContextType>({} as any);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQueryState] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const fuseRef = useRef<Fuse<SearchResult> | null>(null);
  const debouncedQuery = useDebounce(query, 300);
  const router = useRouter();

  // Corrected line:
  const setSearchableData = useCallback((data: SearchResult[], options?: IFuseOptions<SearchResult>) => {
    fuseRef.current = new Fuse<SearchResult>(data, options);
  }, []);

  useEffect(() => {
    if (!fuseRef.current || !debouncedQuery) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const fuseResults = fuseRef.current.search(debouncedQuery);
    setResults(fuseResults.map(r => r.item));
    setIsSearching(false);
  }, [debouncedQuery]);

  const setQuery = useCallback(
    (q: string) => {
      setQueryState(q);
      if (q && !isOpen) setIsOpen(true);
    },
    [isOpen]
  );

  const clearSearch = useCallback(() => {
    setQueryState("");
    setResults([]);
    setSelectedIndex(-1);
  }, []);

  const openSearch = useCallback(() => setIsOpen(true), []);
  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setTimeout(clearSearch, 300);
  }, [clearSearch]);

  const selectNextResult = useCallback(() => {
    if (results.length) setSelectedIndex(i => (i + 1) % results.length);
  }, [results]);
  const selectPrevResult = useCallback(() => {
    if (results.length) setSelectedIndex(i => (i - 1 + results.length) % results.length);
  }, [results]);
  const selectResult = useCallback(
    (i: number) => {
      if (i >= 0 && i < results.length) setSelectedIndex(i);
    },
    [results]
  );

  const navigateToResult = useCallback(
    (result: SearchResult) => {
      setIsOpen(false);
      let url = "/";
      if (result._collection === "users") url = `/user/${result.id}`;
      else if (result._collection === "products") url = `/products/${result.id}`;
      else if (result._collection === "posts") url = `/posts/${result.id}`;
      else if ((result as any).url) url = (result as any).url;
      router.push(url);
    },
    [router]
  );

  const navigateToSelected = useCallback(() => {
    if (selectedIndex >= 0) navigateToResult(results[selectedIndex]);
  }, [results, selectedIndex, navigateToResult]);

  const value = useMemo(
    () => ({
      query,
      results,
      isSearching,
      isOpen,
      selectedIndex,
      setQuery,
      clearSearch,
      openSearch,
      closeSearch,
      selectNextResult,
      selectPrevResult,
      selectResult,
      navigateToSelected,
      navigateToResult,
      setSearchableData
    }),
    [
      query,
      results,
      isSearching,
      isOpen,
      selectedIndex,
      setQuery,
      clearSearch,
      openSearch,
      closeSearch,
      selectNextResult,
      selectPrevResult,
      selectResult,
      navigateToSelected,
      navigateToResult,
      setSearchableData
    ]
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch() {
  return useContext(SearchContext);
}
