"use client";

import { useTransition } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/components/providers/favorites-provider";
import { clientLogger } from "@/lib/utils/logger";

interface FavoriteButtonProps {
  tradespersonId: string;
  initialIsFavorite?: boolean;
}

export function FavoriteButton({ tradespersonId, initialIsFavorite }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite, isAuthenticated, hasInitialized, isMutating } = useFavorites();
  const [isPending, startTransition] = useTransition();

  const favorited = isFavorite(tradespersonId);
  const resolvedFavorite = hasInitialized ? favorited : (initialIsFavorite ?? favorited);

  const handleToggle = () => {
    if (!isAuthenticated || !hasInitialized) {
      return;
    }

    startTransition(() => {
      toggleFavorite(tradespersonId).catch(error => {
        clientLogger.warn("FavoriteButton: Failed to toggle favorite", error);
      });
    });
  };

  const isDisabled = !isAuthenticated || !hasInitialized || isMutating || isPending;

  return (
    <Button
      variant="subtle"
      size="icon"
      onClick={handleToggle}
      disabled={isDisabled}
      aria-pressed={resolvedFavorite}
      aria-label={resolvedFavorite ? "Remove from favorites" : "Save to favorites"}>
      <Heart className={`h-5 w-5 ${resolvedFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
    </Button>
  );
}

export default FavoriteButton;
