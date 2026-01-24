import { requireSession } from "@/lib/auth/require-session";
import { userService } from "@/lib/services/user-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Heart } from "lucide-react";
import Link from "next/link";
import { formatDateGB, getInitials } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

function formatContactValue(value?: string | null): string {
  if (!value) return "Not provided";
  return value;
}

export default async function BusinessOwnerFavoritesPage() {
  const session = await requireSession();
  const ownerId = session.user.id;

  const customers = await userService.getCustomersWhoFavorited(ownerId);

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Profile Favorites"
        description="Review the customers who have bookmarked your business and follow up while interest is high."
      />

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Followers</CardTitle>
            <CardDescription>
              {customers.length === 0
                ? "No customers have favorited your profile yet."
                : `Your business is favorited by ${customers.length} customer${customers.length === 1 ? "" : "s"}.`}
            </CardDescription>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link href="/dashboard/business-owner/customers">Manage customers</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center text-muted-foreground">
              <Heart className="h-12 w-12" />
              <p>Add a call-to-action on your public profile to encourage customers to favorite your business.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {customers.map(customer => {
                const initials = getInitials(customer.name ?? undefined);
                const avatarSrc = customer.profilePicture || customer.image || undefined;
                const memberSince = formatDateGB(customer.createdAt) ?? "Unknown";

                return (
                  <div key={customer.id} className="rounded-lg border p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={avatarSrc ?? ""} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold leading-none">{customer.name ?? "Unnamed customer"}</p>
                        <p className="text-xs text-muted-foreground">Favorited since {memberSince}</p>
                      </div>
                    </div>
                    <dl className="mt-4 space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>{formatContactValue(customer.email)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{formatContactValue(customer.phone)}</span>
                      </div>
                    </dl>
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
