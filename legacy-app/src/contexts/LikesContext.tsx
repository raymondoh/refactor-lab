"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

type LikesContextType = {
  likedProductIds: string[];
  isProductLiked: (productId: string) => boolean;
  toggleLike: (productId: string) => Promise<void>;
  isLoading: boolean;
};

const LikesContext = createContext<LikesContextType | undefined>(undefined);

export function LikesProvider({ children }: { children: React.ReactNode }) {
  const [likedProductIds, setLikedProductIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  // Fetch liked products on initial load if authenticated
  useEffect(() => {
    const fetchLikedProducts = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/likes");

        if (!res.ok) {
          console.error("Error response from /api/likes:", res.status, res.statusText);
          setLikedProductIds([]);
          setIsLoading(false);
          return;
        }

        // Check if response is empty
        const text = await res.text();
        if (!text) {
          console.error("Empty response from /api/likes");
          setLikedProductIds([]);
          setIsLoading(false);
          return;
        }

        // Parse the JSON response
        try {
          const data = JSON.parse(text);
          if (data.success) {
            setLikedProductIds(data.likedProductIds || []);
          } else {
            console.error("API returned error:", data.error);
            setLikedProductIds([]);
          }
        } catch (parseError) {
          console.error("Error parsing JSON:", parseError, "Response text:", text);
          setLikedProductIds([]);
        }
      } catch (error) {
        console.error("Error fetching liked products:", error);
        toast.error("Failed to load your liked products");
        setLikedProductIds([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchLikedProducts();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const isProductLiked = (productId: string) => {
    return likedProductIds.includes(productId);
  };

  const toggleLike = async (productId: string) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to like products");
      return;
    }

    const isCurrentlyLiked = isProductLiked(productId);

    // Optimistically update UI
    setLikedProductIds(prev => (isCurrentlyLiked ? prev.filter(id => id !== productId) : [...prev, productId]));

    try {
      const res = await fetch("/api/likes", {
        method: isCurrentlyLiked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId })
      });

      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = "Something went wrong";

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If parsing fails, use the raw text if available
          if (errorText) errorMessage = errorText;
        }

        throw new Error(errorMessage);
      }

      const text = await res.text();
      if (!text) {
        throw new Error("Empty response from server");
      }

      const data = JSON.parse(text);
      if (!data.success) {
        throw new Error(data.error || "Something went wrong");
      }

      toast.success(`Product ${isCurrentlyLiked ? "removed from" : "added to"} likes`);
    } catch (error: any) {
      // Rollback the optimistic change if the API fails
      setLikedProductIds(prev => (isCurrentlyLiked ? [...prev, productId] : prev.filter(id => id !== productId)));
      toast.error(error.message || "Failed to update likes");
    }
  };

  return (
    <LikesContext.Provider value={{ likedProductIds, isProductLiked, toggleLike, isLoading }}>
      {children}
    </LikesContext.Provider>
  );
}

export function useLikes() {
  const context = useContext(LikesContext);
  if (context === undefined) {
    throw new Error("useLikes must be used within a LikesProvider");
  }
  return context;
}
