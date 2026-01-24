// components/dashboard/user/likes/UserLikesClient.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchUserLikesClient } from "@/actions/client"; // Fetches full product details of liked items
import type { Product } from "@/types/product";
import { ProductCard } from "@/components/products/ProductCard";
import { Loader } from "lucide-react";

import { useLikes } from "@/contexts/LikesContext"; // Key for immediate UI updates
import Link from "next/link";

export function UserLikesClient() {
  // Stores the full product details of items initially fetched as liked
  const [allFetchedLikedProducts, setAllFetchedLikedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // This is the CRITICAL piece: likedProductIds comes from the context,
  // which is optimistically updated when toggleLike is called.
  const { likedProductIds, isLoading: likesContextLoading } = useLikes();

  // 1. Initial Fetch: Get all products the user has liked from the backend.
  useEffect(() => {
    async function loadInitialLikes() {
      setLoading(true);
      try {
        const data = await fetchUserLikesClient(); // Assumes this returns Product[] based on server-side likes
        setAllFetchedLikedProducts(data);
      } catch (err) {
        setError((err as Error).message || "Failed to load liked products.");
      } finally {
        setLoading(false);
      }
    }
    loadInitialLikes();
  }, []); // Runs once on mount

  // 2. Derive Displayed Products:
  // This `useMemo` hook re-calculates `productsToDisplay` WHENEVER `likedProductIds` (from context)
  // or `allFetchedLikedProducts` (from initial fetch) changes.
  const productsToDisplay = useMemo(() => {
    if (loading || likesContextLoading) return []; // Don't process if still loading initial data

    // Filter the initially fetched list of liked products based on the CURRENT (optimistically updated)
    // list of liked IDs from the context. If an ID is removed from likedProductIds,
    // the corresponding product will be filtered out here.
    return allFetchedLikedProducts.filter(product => likedProductIds.includes(product.id));
  }, [allFetchedLikedProducts, likedProductIds, loading, likesContextLoading]);

  // ... (loading, error, no products states) ...

  if (!loading && !likesContextLoading && productsToDisplay.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground mb-4">You haven't liked any products yet.</p>
        <Link href="/products" className="text-primary hover:underline">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {productsToDisplay.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
