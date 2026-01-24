import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { userService } from "@/lib/services/user-service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Star, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { requireSession } from "@/lib/auth/require-session";

interface TradespersonProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function TradespersonProfilePage({ params }: TradespersonProfilePageProps) {
  // The layout guard ensures the user is an authenticated customer or admin.
  // We call requireSession() here to make the authentication requirement explicit for this page.
  await requireSession();

  const { id } = await params;
  const tradesperson = await userService.getUserById(id);

  if (!tradesperson || tradesperson.role !== "tradesperson") {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="flex flex-col items-center text-center gap-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={tradesperson.profilePicture || ""} />
            <AvatarFallback>{(tradesperson.businessName || tradesperson.name || "?").charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{tradesperson.businessName || tradesperson.name}</CardTitle>
            <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span>4.9 (127 reviews)</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{tradesperson.location?.town || "Location not set"}</span>
          </div>
          {tradesperson.serviceAreas && (
            <p className="text-sm text-muted-foreground">Service Areas: {tradesperson.serviceAreas}</p>
          )}
          <div>
            <h2 className="font-semibold mb-2">Specialties</h2>
            <div className="flex flex-wrap gap-2">
              {tradesperson.specialties && tradesperson.specialties.length > 0 ? (
                tradesperson.specialties.map(specialty => (
                  <Badge key={specialty} variant="secondary">
                    {specialty}
                  </Badge>
                ))
              ) : (
                <p>No specialties listed.</p>
              )}
            </div>
          </div>
          <div>
            <h2 className="font-semibold mb-2">Experience</h2>
            <p>
              {tradesperson.experience ? `${tradesperson.experience} years` : "No experience information provided."}
            </p>
          </div>
          <div>
            <h2 className="font-semibold mb-2">Contact</h2>
            {tradesperson.phone ? (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4" />
                <span>{tradesperson.phone}</span>
              </div>
            ) : (
              <p>No contact information provided.</p>
            )}
          </div>
          <div className="pt-4 border-t flex justify-center md:justify-end">
            <Button asChild>
              <Link href={`/dashboard/customer/jobs/create?tradespersonId=${tradesperson.id}`}>Request a Quote</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
