// src/components/products/detail/ProductSpecifications.tsx
"use client";

import type { Product } from "@/types/product";

interface ProductSpecificationsProps {
  product: Product;
}

export function ProductSpecifications({ product }: ProductSpecificationsProps) {
  return (
    <div className="border-t pt-4">
      <h3 className="font-semibold mb-3">Specifications</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm">
        {product.dimensions && (
          <>
            <div className="font-medium">Dimensions</div>
            <div className="text-muted-foreground">{product.dimensions}</div>
          </>
        )}
        {product.material && (
          <>
            <div className="font-medium">Material</div>
            <div className="text-muted-foreground">{product.material}</div>
          </>
        )}
        {product.color && (
          <>
            <div className="font-medium">Color</div>
            <div className="text-muted-foreground">{product.colorDisplayName || product.color}</div>
          </>
        )}
        {product.stickySide && (
          <>
            <div className="font-medium">Sticky Side</div>
            <div className="text-muted-foreground">{product.stickySide}</div>
          </>
        )}
        <div className="font-medium">SKU</div>
        <div className="text-muted-foreground">SKU-{product.id.substring(0, 8).toUpperCase()}</div>

        <div className="font-medium">Availability</div>
        <div className="text-muted-foreground">{product.inStock ? "In Stock" : "Out of Stock"}</div>
      </div>

      {/* Optional extra details */}
      {product.details && (
        <div className="mt-6">
          <h4 className="font-semibold mb-2">Details</h4>
          <p className="text-sm text-muted-foreground">{product.details}</p>
        </div>
      )}
    </div>
  );
}
