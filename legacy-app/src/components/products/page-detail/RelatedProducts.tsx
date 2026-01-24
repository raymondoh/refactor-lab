"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ProductCard } from "@/components/products/ProductCard";
import type { Product } from "@/types/product";

interface RelatedProductsProps {
  products: Product[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  const pathname = usePathname();

  // This effect runs when the pathname changes
  useEffect(() => {
    // Scroll to top when the pathname changes
    window.scrollTo(0, 0);
  }, [pathname]);

  if (products.length === 0) return null;

  return (
    <div className="mt-16">
      {/* <Separator className="mb-8" /> */}
      <h2 className="text-2xl font-bold mb-6">You Might Also Like</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
