// src/app/dashboard/tradesperson/favorited-by/page.tsx
import { redirect } from "next/navigation";
import { canAccess, SERVICE_ROLES } from "@/lib/auth/roles";
import { requireSubscription } from "@/lib/auth/guards";
import { userService } from "@/lib/services/user-service";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart } from "lucide-react";
import { formatDateGB, getInitials } from "@/lib/utils";

export default async function FavoritedByPage() {
  const { session } = await requireSubscription("business", { allowAdminBypass: false });

  // Role guard using shared helper
  if (!canAccess(session.user.role, SERVICE_ROLES)) {
    redirect("/dashboard");
  }

  const customers = await userService.getCustomersWhoFavorited(session.user.id);

  return (
    <div className="space-y-6">
      <DashboardHeader title="Who's Favorited Me" description="See which customers have saved your profile." />

      <Card>
        <CardHeader>
          <CardTitle>Your Followers ({customers.length})</CardTitle>
          <CardDescription>These customers have shown interest in your work.</CardDescription>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No customers have favorited your profile yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customers.map(customer => {
                const initials = getInitials(customer.name ?? undefined);
                const avatarSrc = customer.profilePicture || customer.image || undefined;
                const location = customer.location?.town || customer.location?.postcode || "Location private";
                const memberSince = formatDateGB(customer.createdAt) ?? "Unknown";

                return (
                  <div key={customer.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Avatar>
                      <AvatarImage src={avatarSrc ?? ""} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{customer.name ?? "Unnamed customer"}</p>
                      <p className="text-sm text-muted-foreground">{location}</p>
                      <p className="text-xs text-muted-foreground">Member since: {memberSince}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
