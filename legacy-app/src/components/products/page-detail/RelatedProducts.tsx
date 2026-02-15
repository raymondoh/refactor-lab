//src/components/products/page-detail/RelatedProducts.tsx
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ProductCard } from "@/components/products/ProductCard";
import type { Product } from "@/types/models/product";

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
