// src/components/shared/ProductCarousel.tsx
"use client";

import type React from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import type { Product } from "@/types/product";
import { formatPrice } from "@/lib/utils";
import { SectionHeader } from "@/components/shared/SectionHeader";
// Highlight: Import StarRatingDisplay
import { StarRatingDisplay } from "@/components/products/ratings/StarRatingDisplay"; // Adjust path if necessary

interface ProductCarouselProps {
  products: Product[];
  title: string;
  description?: string;
  viewAllUrl?: string;
  centered?: boolean;
}

export function ProductCarousel({ products, title, description, viewAllUrl, centered = false }: ProductCarouselProps) {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="py-16 w-full bg-background">
      <div className="container mx-auto px-4">
        <SectionHeader title={title} description={description} viewAllUrl={viewAllUrl} centered={centered} />

        <Carousel
          opts={{
            align: "start",
            loop: products.length > 4
          }}
          className="relative">
          <CarouselContent className="-ml-4">
            {products.map(product => {
              const displayPrice = product.salePrice || product.price;
              const isOnSale = product.onSale && product.salePrice && product.salePrice < product.price;

              return (
                <CarouselItem
                  key={product.id}
                  // This line is changed to show 1 and a bit slides on mobile
                  className="pl-4 basis-4/5 sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                  <div className="h-full">
                    <Card className="group h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg">
                      <div className="relative aspect-square overflow-hidden bg-gray-50">
                        <Link href={`/products/${product.id}`}>
                          <Image
                            src={product.image || `/placeholder.svg?height=300&width=300&query=${product.name}+sticker`}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 80vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            placeholder="blur"
                            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxOAPwCdABmX/9k="
                          />
                        </Link>
                        {isOnSale && (
                          <Badge className="absolute top-2 left-2 bg-red-500 text-white pointer-events-none">
                            Sale
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4 flex flex-col flex-grow">
                        <Link href={`/products/${product.id}`}>
                          <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                            {product.name}
                          </h3>
                        </Link>
                        {/* Highlight: Add StarRatingDisplay here */}
                        <div className="mt-1 mb-2">
                          {" "}
                          {/* Added some margin for spacing */}
                          <StarRatingDisplay
                            averageRating={product.averageRating || 0}
                            reviewCount={product.reviewCount || 0}
                            size={16} // Smaller size for carousel items
                            showReviewCount={true}
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-auto">
                          {isOnSale ? (
                            <>
                              <span className="font-bold text-primary"> {formatPrice(displayPrice, "gbp")}</span>
                              <span className="text-sm text-muted-foreground line-through">
                                {formatPrice(product.price, "gbp")}
                              </span>
                            </>
                          ) : (
                            <span className="font-bold">{formatPrice(displayPrice, "gbp")}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm hidden md:flex" />
          <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm hidden md:flex" />
        </Carousel>
      </div>
    </section>
  );
}
