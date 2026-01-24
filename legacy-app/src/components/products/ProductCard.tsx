// src/components/products/ProductCard.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types/product";
import { ProductLikeButton } from "./ProductLikeButton";
import { ProductCardButton } from "./ProductCardButton";
import { formatPrice } from "@/lib/utils";
// Highlight: Import the StarRatingDisplay component
import { StarRatingDisplay } from "./ratings/StarRatingDisplay";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const displayPrice = product.salePrice || product.price;
  const isOnSale = product.onSale && product.salePrice && product.salePrice < product.price;

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/20 h-full flex flex-col">
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {/* Optimized product image */}
        <Image
          src={product.image || `/placeholder.svg?height=400&width=400&query=${product.name}+sticker`}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        />

        {/* Sale badge */}
        {isOnSale && <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 text-white">Sale</Badge>}

        {/* Quick action buttons */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <ProductLikeButton product={product} position="none" className="h-8 w-8" />
        </div>

        {/* Quick add to cart on hover */}
        <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <ProductCardButton product={product} className="w-full" />
        </div>
      </div>

      <CardContent className="p-4 flex flex-col flex-1">
        <Link href={`/products/${product.id}`} className="block">
          <h3 className="font-semibold text-sm mb-2 truncate group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Highlight: Add StarRatingDisplay here */}
        <div className="mb-2">
          {" "}
          {/* Added a div for spacing, adjust margin as needed */}
          <StarRatingDisplay
            averageRating={product.averageRating || 0} // Use 0 if not present
            reviewCount={product.reviewCount || 0} // Use 0 if not present
            size={16} // Smaller stars for product cards
            showReviewCount={true} // Display the count
          />
        </div>

        {/* Description with fixed height */}
        <div className="min-h-[2.5rem] mb-2">
          {product.description && <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>}
        </div>

        {/* Price and stock section */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {isOnSale ? (
              <>
                <span className="font-bold text-primary">{formatPrice(displayPrice, "gbp")}</span>
                <span className="text-sm text-muted-foreground line-through">{formatPrice(product.price, "gbp")}</span>
              </>
            ) : (
              <span className="font-bold">{formatPrice(displayPrice, "gbp")}</span>
            )}
          </div>

          {product.inStock ? (
            <Badge variant="secondary" className="text-xs">
              In Stock
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-xs">
              Out of Stock
            </Badge>
          )}
        </div>

        {/* Design themes with fixed height - pushes to bottom */}
        <div className="mt-auto">
          <div className="min-h-[1.75rem]">
            {product.designThemes && product.designThemes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {product.designThemes.slice(0, 2).map(theme => (
                  <Badge key={theme} variant="outline" className="text-xs">
                    {theme}
                  </Badge>
                ))}
                {product.designThemes.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{product.designThemes.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
