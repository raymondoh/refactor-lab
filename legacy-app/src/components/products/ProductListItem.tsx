"use client";
import Link from "next/link";
import Image from "next/image";
import { Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { ProductCardButton } from "@/components/products/ProductCardButton";
import type { Product } from "@/types/product";

interface ProductListItemProps {
  product: Product;
}

export function ProductListItem({ product }: ProductListItemProps) {
  // Calculate a rating based on product id for demo purposes
  const demoRating = Math.floor((Number.parseInt(product.id.slice(-2), 16) % 5) + 1);
  const demoReviewCount = Math.floor((Number.parseInt(product.id.slice(-4), 16) % 100) + 5);

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg transition-all duration-300 group bg-gradient-to-r from-background to-secondary/5 hover:shadow-sm hover:shadow-secondary/20 hover:translate-y-[-2px]">
      {/* Product Image - Fixed dimensions with proper positioning */}
      <div className="relative w-full sm:w-48 h-48 flex-shrink-0">
        <Link href={`/products/${product.id}`} className="block h-full">
          <div className="relative h-full w-full overflow-hidden bg-secondary/5 rounded-md">
            {/* Using position relative with width and height 100% for the image container */}
            <div className="relative w-full h-full">
              <Image
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                className="object-contain transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 192px"
                fill
                priority
              />
            </div>
          </div>
        </Link>
      </div>

      {/* Product Details */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-1">
          {product.category && (
            <Link href={`/products?category=${product.category.toLowerCase().replace(/\s+/g, "-")}`}>
              <span className="text-xs text-muted-foreground hover:text-primary transition-colors">
                {product.category}
              </span>
            </Link>
          )}

          {/* Moved badge here, next to the category */}
          {product.badge && (
            <Badge
              className={`${
                product.badge.toLowerCase() === "new"
                  ? "bg-primary"
                  : product.badge.toLowerCase() === "sale"
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary"
              }`}>
              {product.badge}
            </Badge>
          )}
        </div>

        <Link href={`/products/${product.id}`} className="block group-hover:text-primary transition-colors">
          <h3 className="text-lg font-medium">{product.name}</h3>
        </Link>

        <div className="flex items-center mt-1 mb-2">
          <div className="flex items-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-3 w-3 ${i < demoRating ? "text-accent fill-accent" : "text-muted/20"}`} />
            ))}
          </div>
          <span className="text-xs text-muted-foreground ml-1">({demoReviewCount})</span>
        </div>

        {/* Description preview */}
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{product.description}</p>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className="font-bold text-lg">{formatPrice(product.price, "gbp")}</span>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Heart className="h-4 w-4" />
              <span className="sr-only">Add to wishlist</span>
            </Button>
            <ProductCardButton product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}
