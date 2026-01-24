// src/components/products/page-detail/ProductGallery.tsx
"use client";

import Image from "next/image";
import { useState } from "react";
import type { Product } from "@/types/product";

interface ProductGalleryProps {
  product: Product;
}

export function ProductGallery({ product }: ProductGalleryProps) {
  const imageList =
    product.images && product.images.length > 0
      ? product.images
      : product.image
        ? [product.image]
        : ["/placeholder.svg"];

  const [activeImage, setActiveImage] = useState(imageList[0]);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted">
        {isLoading && <div className="absolute inset-0 animate-pulse bg-muted" />}
        <Image
          src={activeImage}
          alt={product.name}
          fill
          className={`object-contain p-6 ${isLoading ? "hidden" : "block"}`}
          sizes="(max-width: 768px) 100vw, 500px"
          priority
          onLoad={() => setIsLoading(false)}
        />
      </div>

      {/* Thumbnails */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {imageList.map((img, i) => (
          <button
            key={i}
            onClick={() => {
              setIsLoading(true);
              setActiveImage(img);
            }}
            className={`relative w-20 h-20 rounded-md overflow-hidden border-2 ${
              activeImage === img ? "border-primary" : "border-transparent"
            }`}>
            <Image src={img} alt={`Thumbnail ${i + 1}`} fill className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
