"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useLikes } from "@/contexts/LikesContext";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";

interface ProductLikeButtonProps {
  product: Product;
  showText?: boolean;
  className?: string;
  position?: "top-right" | "bottom-right" | "none";
}

export function ProductLikeButton({
  product,
  showText = false,
  className = "",
  position = "top-right"
}: ProductLikeButtonProps) {
  const router = useRouter();
  const { isProductLiked, toggleLike } = useLikes();
  const [isPending, setIsPending] = useState(false);
  const { status } = useSession();

  const isLiked = isProductLiked(product.id);
  const isSessionLoading = status === "loading";
  const isLoggedIn = status === "authenticated";

  async function handleToggleLike() {
    if (!isLoggedIn) {
      toast.error("Please sign in to like products");
      // Redirect to login page
      setTimeout(() => {
        router.push("/login");
      }, 1000);
      return;
    }

    setIsPending(true);
    try {
      await toggleLike(product.id);
    } finally {
      setIsPending(false);
    }
  }

  const positionClasses = {
    "top-right": "absolute top-2 right-2",
    "bottom-right": "absolute bottom-2 right-2",
    none: ""
  };

  return (
    <div
      role="button"
      tabIndex={isPending || isSessionLoading ? -1 : 0}
      onClick={isPending || isSessionLoading ? undefined : handleToggleLike}
      onKeyDown={e => {
        if ((e.key === "Enter" || e.key === " ") && !(isPending || isSessionLoading)) {
          e.preventDefault();
          handleToggleLike();
        }
      }}
      aria-disabled={isPending || isSessionLoading}
      aria-pressed={isLiked}
      className={cn(
        "inline-flex items-center justify-center rounded-full p-2 bg-background/80 backdrop-blur-sm hover:bg-background transition-colors",
        positionClasses[position],
        isPending || isSessionLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        className
      )}>
      <Heart
        className={`h-4 w-4 transition-colors ${isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
      />
      {showText && <span className="ml-2 text-sm">{isLiked ? "Remove from Wishlist" : "Add to Wishlist"}</span>}
    </div>
  );
}
