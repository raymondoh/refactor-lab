// src/components/products/detail/ProductTabs.tsx
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Product } from "@/types/product";

interface ProductTabsProps {
  product: Product;
}

export function ProductTabs({ product }: ProductTabsProps) {
  return (
    <div className="mt-16">
      <Tabs defaultValue="description" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="specifications">Specifications</TabsTrigger>
          <TabsTrigger value="shipping">Shipping & Returns</TabsTrigger>
        </TabsList>

        {/* Description Tab */}
        <TabsContent value="description" className="p-4 border rounded-md mt-2">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <h3 className="text-lg font-semibold mb-2">Product Description</h3>
            <p>{product.description}</p>
            {product.details && (
              <>
                <h4 className="text-md font-semibold mt-4 mb-2">Additional Details</h4>
                <p>{product.details}</p>
              </>
            )}
          </div>
        </TabsContent>

        {/* Specifications Tab */}
        <TabsContent value="specifications" className="p-4 border rounded-md mt-2">
          <h3 className="text-lg font-semibold mb-4">Technical Specifications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4">
            {product.dimensions && (
              <div className="flex flex-col">
                <span className="text-sm font-medium">Dimensions</span>
                <span className="text-sm text-muted-foreground">{product.dimensions}</span>
              </div>
            )}
            {product.material && (
              <div className="flex flex-col">
                <span className="text-sm font-medium">Material</span>
                <span className="text-sm text-muted-foreground">{product.material}</span>
              </div>
            )}
            {product.color && (
              <div className="flex flex-col">
                <span className="text-sm font-medium">Color</span>
                <span className="text-sm text-muted-foreground">{product.colorDisplayName || product.color}</span>
              </div>
            )}
            {product.stickySide && (
              <div className="flex flex-col">
                <span className="text-sm font-medium">Sticky Side</span>
                <span className="text-sm text-muted-foreground">{product.stickySide}</span>
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium">SKU</span>
              <span className="text-sm text-muted-foreground">SKU-{product.id.substring(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Availability</span>
              <span className="text-sm text-muted-foreground">{product.inStock ? "In Stock" : "Out of Stock"}</span>
            </div>
          </div>
        </TabsContent>

        {/* Shipping & Returns Tab */}
        <TabsContent value="shipping" className="p-4 border rounded-md mt-2">
          <h3 className="text-lg font-semibold mb-4">Shipping & Returns</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-md font-medium mb-2">Shipping Information</h4>
              <p className="text-sm text-muted-foreground">
                We offer free standard shipping on all orders over £50. Orders typically ship within 1-2 business days.
                Delivery times vary by location, but typically take 3-5 business days after shipping.
              </p>
            </div>
            <div>
              <h4 className="text-md font-medium mb-2">Return Policy</h4>
              <p className="text-sm text-muted-foreground">
                If you're not completely satisfied with your purchase, you can return it within 30 days for a full
                refund. Items must be unused and in their original packaging.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
