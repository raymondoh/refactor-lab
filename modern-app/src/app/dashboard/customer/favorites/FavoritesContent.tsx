"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Heart, MapPin, Star } from "lucide-react";

import FavoriteButton from "@/components/favorites/favorite-button";
import { useFavorites } from "@/components/providers/favorites-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { User } from "@/lib/types/user";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Pagination } from "@/components/ui/pagination";
import { clientLogger } from "@/lib/utils/logger";

interface FavoritesContentProps {
  initialFavorites: User[];
}

const FETCH_OPTIONS: RequestInit = {
  cache: "no-store"
};

const FavoritesContent = ({ initialFavorites }: FavoritesContentProps) => {
  const { favorites, hasInitialized, isAuthenticated } = useFavorites();
  const [localFavorites, setLocalFavorites] = useState<User[]>(initialFavorites);
  const searchParams = useSearchParams();

  useEffect(() => {
    setLocalFavorites(initialFavorites);
  }, [initialFavorites]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocalFavorites([]);
      return;
    }

    if (!hasInitialized) {
      return;
    }

    let isActive = true;

    const refreshFavorites = async () => {
      try {
        const response = await fetch("/api/favorites", FETCH_OPTIONS);
        if (!response.ok) {
          throw new Error(`Failed to fetch favorites: ${response.statusText}`);
        }

        const data = (await response.json()) as { favorites?: User[] };
        if (!isActive) {
          return;
        }

        if (Array.isArray(data.favorites)) {
          setLocalFavorites(data.favorites);
        }
      } catch (error) {
        clientLogger.error("FavoritesContent: Failed to refresh favorites", error);
      }
    };

    void refreshFavorites();

    return () => {
      isActive = false;
    };
  }, [favorites, hasInitialized, isAuthenticated]);

  const itemsPerPage = 6;
  const totalPages = Math.max(1, Math.ceil(localFavorites.length / itemsPerPage));
  const rawPage = Number(searchParams.get("page") ?? "1");
  const currentPage = Number.isFinite(rawPage) && rawPage > 0 ? Math.min(Math.floor(rawPage), totalPages) : 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleFavorites = useMemo(
    () => localFavorites.slice(startIndex, startIndex + itemsPerPage),
    [localFavorites, startIndex, itemsPerPage]
  );

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Favorite Tradespeople"
        description="Your saved list of preferred tradespeople for future jobs."
      />

      {localFavorites.length > 0 ? (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleFavorites.map(plumber => (
              <Card key={plumber.id}>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={plumber.profilePicture || ""} />
                      <AvatarFallback>{(plumber.businessName || plumber.name || "?").charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle>{plumber.businessName || plumber.name}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span>4.9 (127 reviews)</span>
                      </div>
                    </div>
                  </div>
                  <FavoriteButton tradespersonId={plumber.id} initialIsFavorite />
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{plumber.location?.town || "Location not set"}</span>
                  </div>

                  {plumber.serviceAreas && (
                    <p className="text-sm text-muted-foreground">Service Areas: {plumber.serviceAreas}</p>
                  )}

                  {plumber.experience && (
                    <p className="text-sm text-muted-foreground">Experience: {plumber.experience} years</p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {plumber.specialties?.slice(0, 3).map(specialty => (
                      <Badge key={specialty} variant="secondary">
                        {specialty}
                      </Badge>
                    ))}
                  </div>

                  <div className="pt-4 border-t flex justify-end">
                    <Button asChild>
                      <Link href={`/profile/tradesperson/${plumber.slug}`}>View Profile</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {localFavorites.length > itemsPerPage && <Pagination currentPage={currentPage} totalPages={totalPages} />}
        </>
      ) : (
        <>
          <Card className="py-16 text-center">
            <CardContent className="space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Heart className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold">You haven’t favorited any tradespeople yet</h3>
              <Button asChild className="mt-3">
                <Link href="/search">Browse plumbers</Link>
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default FavoritesContent;
