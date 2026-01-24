// src/components/products/ratings/StarRatingDisplay.tsx
"use client";

import { Star } from "lucide-react";
import React from "react";

interface StarRatingDisplayProps {
  averageRating: number;
  reviewCount: number;
  size?: number; // Size of the stars in pixels, e.g., 20
  showReviewCount?: boolean; // Optional: whether to display the review count
}

export function StarRatingDisplay({
  averageRating,
  reviewCount,
  size = 20, // Default size
  showReviewCount = true // Default to true
}: StarRatingDisplayProps) {
  const fullStars = Math.floor(averageRating);
  const hasHalfStar = averageRating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center space-x-1">
      {/* Render full stars */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`full-${i}`} className="text-yellow-400 fill-yellow-400" size={size} />
      ))}

      {/* Render half star if applicable */}
      {hasHalfStar && (
        <div className="relative">
          <Star
            className="text-yellow-400 fill-yellow-400"
            size={size}
            style={{ clipPath: "inset(0 50% 0 0)" }} // Clip to show left half
          />
          <Star className="text-muted-foreground absolute top-0 left-0" size={size} />
        </div>
      )}

      {/* Render empty stars */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`empty-${i}`} className="text-muted-foreground" size={size} />
      ))}

      {/* Display review count */}
      {showReviewCount && reviewCount > 0 && (
        <span className="ml-2 text-sm text-muted-foreground">({reviewCount} reviews)</span>
      )}
      {showReviewCount && reviewCount === 0 && (
        <span className="ml-2 text-sm text-muted-foreground">(No reviews yet)</span>
      )}
    </div>
  );
}
