// src/components/providers/favorites-provider.tsx
"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { clientLogger } from "@/lib/utils/logger";

interface FavoritesContextValue {
  favorites: string[];
  isFavorite: (tradespersonId: string) => boolean;
  toggleFavorite: (tradespersonId: string) => Promise<void>;
  refreshFavorites: () => Promise<void>;
  isLoading: boolean;
  isMutating: boolean;
  isAuthenticated: boolean;
  hasInitialized: boolean;
}

interface FavoritesProviderProps {
  children: ReactNode;
  initialFavorites?: string[];
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

function extractFavoriteIds(rawFavorites: unknown): string[] {
  if (!Array.isArray(rawFavorites)) {
    return [];
  }

  const ids = rawFavorites
    .map(item => {
      if (item && typeof item === "object" && "id" in item) {
        const id = (item as { id?: unknown }).id;
        return typeof id === "string" ? id : null;
      }
      if (typeof item === "string") {
        return item;
      }
      return null;
    })
    .filter((id): id is string => Boolean(id));

  return Array.from(new Set(ids));
}

function arraysHaveSameMembers(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
      return data.error;
    }
  } catch {
    // Ignore JSON parse errors – we'll fall back to a generic message.
  }
  return `Request failed with status ${response.status}`;
}

export function FavoritesProvider({ children, initialFavorites = [] }: FavoritesProviderProps) {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isCustomer = session?.user?.role === "customer";
  const normalizedInitialFavorites = useMemo(
    () => Array.from(new Set(initialFavorites.filter(id => typeof id === "string"))),
    [initialFavorites]
  );

  const [favorites, setFavorites] = useState<string[]>(normalizedInitialFavorites);
  const [isFetchingFavorites, setIsFetchingFavorites] = useState<boolean>(
    () => status === "loading" || (isAuthenticated && isCustomer && normalizedInitialFavorites.length === 0)
  );
  const [isMutating, setIsMutating] = useState(false);
  const [hasInitialized, setHasInitialized] = useState<boolean>(normalizedInitialFavorites.length > 0 || !isCustomer);

  const isMountedRef = useRef(true);
  const hasFetchedOnceRef = useRef(false);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isMountedRef.current) {
      return;
    }

    setFavorites(prev => {
      if (arraysHaveSameMembers(prev, normalizedInitialFavorites)) {
        return prev;
      }
      return normalizedInitialFavorites;
    });

    if (normalizedInitialFavorites.length > 0) {
      setHasInitialized(true);
      setIsFetchingFavorites(false);
    }
  }, [normalizedInitialFavorites]);

  useEffect(() => {
    if (!isMountedRef.current) {
      return;
    }

    if (status === "unauthenticated") {
      setFavorites([]);
      setIsMutating(false);
      setHasInitialized(true);
      setIsFetchingFavorites(false);
      hasFetchedOnceRef.current = false;
    }

    if (status === "loading") {
      setIsFetchingFavorites(true);
    }
  }, [status]);

  const fetchFavorites = useCallback(
    async (options?: { withLoading?: boolean }) => {
      if (!isMountedRef.current) {
        return;
      }

      if (!isAuthenticated || !isCustomer) {
        setFavorites([]);
        setHasInitialized(true);
        setIsFetchingFavorites(false);
        return;
      }

      const shouldShowLoading = options?.withLoading ?? false;
      if (shouldShowLoading) {
        setIsFetchingFavorites(true);
      }

      try {
        const response = await fetch("/api/favorites", {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error(await readErrorMessage(response));
        }

        const payload = await response.json();
        const ids = extractFavoriteIds(payload?.favorites);

        if (isMountedRef.current) {
          setFavorites(ids);
          setHasInitialized(true);
        }
      } catch (error) {
        clientLogger.error("FavoritesProvider: Failed to fetch favorites", error);
      } finally {
        if (isMountedRef.current) {
          setIsFetchingFavorites(false);
          setHasInitialized(true);
        }
      }
    },
    [isAuthenticated, isCustomer]
  );

  useEffect(() => {
    if (!isAuthenticated || !isCustomer || hasFetchedOnceRef.current) {
      return;
    }

    hasFetchedOnceRef.current = true;
    fetchFavorites({ withLoading: normalizedInitialFavorites.length === 0 }).catch(error => {
      clientLogger.error("FavoritesProvider: Initial fetch failed", error);
    });
  }, [fetchFavorites, isAuthenticated, isCustomer, normalizedInitialFavorites.length]);

  useEffect(() => {
    if (!isAuthenticated || !isCustomer) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchFavorites().catch(error => {
          clientLogger.error("FavoritesProvider: Visibility refresh failed", error);
        });
      }
    };

    const handleOnline = () => {
      fetchFavorites().catch(error => {
        clientLogger.error("FavoritesProvider: Online refresh failed", error);
      });
    };

    window.addEventListener("focus", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("focus", handleVisibilityChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
    };
  }, [fetchFavorites, isAuthenticated, isCustomer]);

  const toggleFavorite = useCallback(
    async (tradespersonId: string) => {
      if (!isMountedRef.current) {
        return;
      }

      if (!isAuthenticated || !isCustomer) {
        throw new Error("User must be an authenticated customer to manage favorites.");
      }

      setIsMutating(true);

      const previousFavorites = [...favorites];
      const wasFavorite = previousFavorites.includes(tradespersonId);

      setFavorites(prev => {
        if (wasFavorite) {
          return prev.filter(id => id !== tradespersonId);
        }
        if (prev.includes(tradespersonId)) {
          return prev;
        }
        return [...prev, tradespersonId];
      });

      try {
        const endpoint = wasFavorite
          ? `/api/favorites?tradespersonId=${encodeURIComponent(tradespersonId)}`
          : "/api/favorites";
        const response = await fetch(endpoint, {
          method: wasFavorite ? "DELETE" : "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
          },
          body: wasFavorite ? undefined : JSON.stringify({ tradespersonId })
        });

        if (!response.ok) {
          throw new Error(await readErrorMessage(response));
        }

        await fetchFavorites();
      } catch (error) {
        clientLogger.error("FavoritesProvider: Failed to toggle favorite", error);
        if (isMountedRef.current) {
          setFavorites(previousFavorites);
        }
        throw error;
      } finally {
        if (isMountedRef.current) {
          setIsMutating(false);
        }
      }
    },
    [favorites, fetchFavorites, isAuthenticated, isCustomer]
  );

  const refreshFavorites = useCallback(async () => {
    await fetchFavorites();
  }, [fetchFavorites]);

  const isFavorite = useCallback((tradespersonId: string) => favorites.includes(tradespersonId), [favorites]);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      isFavorite,
      toggleFavorite,
      refreshFavorites,
      isLoading: status === "loading" || isFetchingFavorites,
      isMutating,
      isAuthenticated: isAuthenticated && isCustomer,
      hasInitialized
    }),
    [
      favorites,
      hasInitialized,
      isAuthenticated,
      isCustomer,
      isFavorite,
      isFetchingFavorites,
      isMutating,
      refreshFavorites,
      toggleFavorite,
      status
    ]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}

export default FavoritesProvider;
