import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, MapPin, PoundSterling, Clock, FileText, Mail, Phone, Images, CheckCircle } from "lucide-react";
import { formatDateGB } from "@/lib/utils";
import type { Job, PaymentStatus } from "@/lib/types/job";
import { asTier, meets, type Tier } from "@/lib/subscription/tier";
import { Button } from "../ui/button";
import Link from "next/link";
import { getStatusColor, getStatusLabel, getUrgencyColor, getUrgencyLabel } from "@/lib/types/job";
import { Separator } from "../ui/separator";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Image from "next/image";

interface JobSummaryCardProps {
  job: Job;
  tier: Tier;
  actions?: React.ReactNode;
}

export function JobSummaryCard({ job, tier, actions }: JobSummaryCardProps) {
  const effectiveTier = asTier(tier);
  const isProTier = meets(effectiveTier, "pro");

  const depositPaidStatuses = new Set<PaymentStatus>([
    "deposit_paid",
    "pending_final",
    "fully_paid",
    "authorized",
    "captured",
    "succeeded"
  ]);
  const hasDepositBeenPaid = job.paymentStatus ? depositPaidStatuses.has(job.paymentStatus) : false;
  const isFullyPaid = job.paymentStatus === "fully_paid";

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="bg-muted/50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-xl text-card-foreground mb-2">{job.title}</CardTitle>
            <CardDescription className="text-muted-foreground text-base leading-relaxed">
              {job.description}
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isFullyPaid ? (
              <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Paid in Full
              </Badge>
            ) : hasDepositBeenPaid ? (
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Deposit Paid
              </Badge>
            ) : null}
            <Badge className={getStatusColor(job.status)}>{getStatusLabel(job.status)}</Badge>
            <Badge className={getUrgencyColor(job.urgency)}>
              <Clock className="h-3 w-3 mr-1" />
              {getUrgencyLabel(job.urgency)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {job.photos && job.photos.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Images className="h-4 w-4" />
              Customer Photos
            </h3>
            <Carousel className="w-full max-w-sm mx-auto">
              <CarouselContent>
                {job.photos.map((photo, index) => (
                  <CarouselItem key={index}>
                    <div className="p-1">
                      <Card>
                        <CardContent className="flex aspect-square items-center justify-center p-0 overflow-hidden rounded-lg">
                          <Image
                            src={photo}
                            alt={`Job photo ${index + 1}`}
                            width={400}
                            height={400}
                            className="object-cover w-full h-full"
                          />
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="font-medium">Location</span>
            </div>
            <div className="text-card-foreground">
              <div className="font-medium">{job.location.postcode}</div>
              {job.location.address && <div className="text-sm text-muted-foreground">{job.location.address}</div>}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="font-medium">Customer</span>
            </div>
            {isProTier ? (
              <div className="space-y-1">
                <div className="text-card-foreground font-medium">{job.customerContact.name}</div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span>{job.customerContact.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span>{job.customerContact.email}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="h-5 w-2/3 bg-muted rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                <Button asChild size="sm" className="mt-2">
                  <Link href="/pricing">Upgrade to Pro to View</Link>
                </Button>
              </div>
            )}
          </div>

          {job.budget && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <PoundSterling className="h-4 w-4 text-green-500" />
                <span className="font-medium">Budget</span>
              </div>
              <div className="text-card-foreground font-semibold dark:text-green-400">£{job.budget}</div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span className="font-medium">Details</span>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>Posted: {formatDateGB(job.createdAt)}</div>
              {job.scheduledDate && <div>Preferred: {formatDateGB(job.scheduledDate)}</div>}
              <Badge variant="outline">Job ID: {job.id.slice(0, 8)}...</Badge>
            </div>
          </div>
        </div>
      </CardContent>
      {actions && (
        <>
          <Separator />
          <CardFooter className="p-6">
            <div className="w-full">{actions}</div>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
