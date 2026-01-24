// src/components/products/ratings/RatingInput.tsx
"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button"; // Assuming you have this Button component
import { toast } from "sonner"; // For notifications
import { useSession } from "next-auth/react"; // To get userId and userName

interface RatingInputProps {
  productId: string;
  onRatingSubmitted?: () => void; // Optional callback after successful submission
}

export function RatingInput({ productId, onRatingSubmitted }: RatingInputProps) {
  const { data: session, status } = useSession();
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userId = session?.user?.id; // Assuming your session provides a user ID
  const authorName = session?.user?.name || session?.user?.email?.split("@")[0] || "Anonymous"; // Fallback for author name

  const handleStarClick = (ratingValue: number) => {
    setSelectedRating(ratingValue);
  };

  const handleStarHover = (ratingValue: number) => {
    setHoveredRating(ratingValue);
  };

  const handleMouseLeave = () => {
    setHoveredRating(0);
  };

  const handleSubmit = async () => {
    if (!userId) {
      toast.error("You must be logged in to submit a rating.");
      return;
    }
    if (selectedRating === 0) {
      toast.error("Please select a star rating.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          productId,
          userId,
          authorName,
          rating: selectedRating
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit rating.");
      }

      toast.success(data.message || "Thank you for your rating!");
      setSelectedRating(0); // Reset stars after submission
      onRatingSubmitted?.(); // Call any parent callback
    } catch (error: any) {
      console.error("Error submitting rating:", error);
      toast.error(error.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show a loading state or prompt to log in if session is not ready
  if (status === "loading") {
    return <p className="text-muted-foreground">Loading user data...</p>;
  }

  return (
    <div className="flex flex-col items-start gap-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
      <h3 className="text-lg font-semibold">Rate this Product</h3>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`
              h-7 w-7 cursor-pointer transition-colors
              ${
                hoveredRating >= star || selectedRating >= star
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-muted-foreground"
              }
            `}
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => handleStarHover(star)}
            onMouseLeave={handleMouseLeave}
          />
        ))}
      </div>
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || selectedRating === 0 || !userId}
        className="w-full sm:w-auto">
        {isSubmitting ? "Submitting..." : "Submit Rating"}
      </Button>
      {!userId && <p className="text-sm text-muted-foreground">Please log in to submit a rating.</p>}
    </div>
  );
}
