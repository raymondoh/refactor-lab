// // src/components/profile/profile-page.tsx
// "use client";

// import Link from "next/link";
// import Image from "next/image";
// import { DashboardHeader } from "@/components/dashboard/dashboard-header";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { CertificationBadge } from "@/components/certifications/certification-badge";
// import { User, MapPin, Edit, Calendar, Wrench, Lock, type LucideIcon, FolderKanban } from "lucide-react";
// import type { User as UserType } from "@/lib/types/user";
// import SubscriptionGuard from "@/components/auth/subscription-guard";
// import { formatDateGB, formatDateTimeGB, getInitials } from "@/lib/utils";
// import DashboardCertificationList from "@/components/dashboard/dashboard-certification-list";
// import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
// import type { JobServiceType } from "@/lib/config/locations";

// /** Consistent label/value row */
// const ProfileDataItem = ({ label, value }: { label: string; value?: string | null }) => (
//   <div>
//     <label className="text-sm font-medium text-muted-foreground">{label}</label>
//     {value ? (
//       <p className="text-lg text-foreground">{value}</p>
//     ) : (
//       <p className="text-lg text-muted-foreground italic">Not provided</p>
//     )}
//   </div>
// );

// /** Generic section card  */
// const InfoCard = ({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) => (
//   <Card>
//     <CardHeader>
//       <CardTitle className="flex items-center gap-2">
//         <Icon className="h-5 w-5 text-primary" />
//         {title}
//       </CardTitle>
//     </CardHeader>
//     <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">{children}</CardContent>
//   </Card>
// );

// interface ProfilePageProps {
//   user: UserType;
//   sessionImage?: string | null;
// }

// export default function EnhancedProfilePage({ user, sessionImage }: ProfilePageProps) {
//   const {
//     role,
//     firstName,
//     lastName,
//     name,
//     email,
//     businessName,
//     profilePicture,
//     onboardingComplete,
//     emailVerified,
//     phone,
//     specialties,
//     experience,
//     hourlyRate,
//     description,
//     location,
//     serviceAreas,
//     portfolio,
//     certifications,
//     createdAt,
//     updatedAt,
//     lastLoginAt
//   } = user;

//   const isTradesperson = role === "tradesperson";
//   const subjectTier = (user.subscriptionTier ?? "basic") as "basic" | "pro" | "business";

//   const displayName =
//     (isTradesperson ? businessName : null) || `${firstName || ""} ${lastName || ""}`.trim() || name || email;

//   // Public profile slug (matches your public route: /profile/tradesperson/:slug)
//   // If User has no slug field yet, this gracefully falls back to the user.id
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   const profileSlug = (user as any).slug ?? user.id;
//   const serviceTypes = (user.serviceTypes ?? []) as JobServiceType[];

//   return (
//     <div className="space-y-6">
//       <DashboardHeader
//         title="My Profile"
//         description="Manage your personal details and account information."
//         actions={
//           <div className="flex flex-wrap gap-2">
//             {isTradesperson && (
//               <Button asChild variant="secondary">
//                 <Link href={`/profile/tradesperson/${profileSlug}`} target="_blank">
//                   <User className="h-4 w-4 mr-2" />
//                   View Public Profile
//                 </Link>
//               </Button>
//             )}
//             <Button asChild>
//               <Link href={`/dashboard/${role}/profile/edit`}>
//                 <Edit className="h-4 w-4 mr-2" />
//                 Edit Profile
//               </Link>
//             </Button>
//           </div>
//         }
//       />

//       {/* Overview */}
//       <Card>
//         <CardHeader>
//           <div className="flex items-center gap-4">
//             <Avatar className="h-20 w-20">
//               <AvatarImage src={profilePicture || sessionImage || ""} alt={displayName || "User Avatar"} />
//               <AvatarFallback className="text-xl bg-primary text-primary-foreground">
//                 {getInitials(displayName)}
//               </AvatarFallback>
//             </Avatar>
//             <div className="space-y-2">
//               <CardTitle className="text-2xl">{displayName}</CardTitle>

//               {/* Business name is now here, styled as a subtitle */}
//               {user.businessName && <p className="text-md text-muted-foreground">{user.businessName}</p>}

//               <div className="flex items-center gap-2 flex-wrap">
//                 <Badge variant="secondary">Role: {role}</Badge>
//                 <Badge variant={emailVerified ? "default" : "destructive"}>
//                   Email: {emailVerified ? "Verified" : "Unverified"}
//                 </Badge>
//                 {isTradesperson && onboardingComplete && <Badge variant="default">Profile Complete</Badge>}
//                 {isTradesperson &&
//                   user.certifications
//                     ?.filter(c => c.verified)
//                     .map(cert => <CertificationBadge key={cert.id} cert={cert} />)}
//               </div>
//             </div>
//           </div>
//         </CardHeader>
//       </Card>

//       {/* Info grid */}
//       <div className="grid xl:grid-cols-2 gap-6">
//         <InfoCard title="Personal Information" icon={User}>
//           <ProfileDataItem label="First Name" value={firstName} />
//           <ProfileDataItem label="Last Name" value={lastName} />
//           <ProfileDataItem label="Email" value={email} />
//           <ProfileDataItem label="Phone Number" value={phone} />
//         </InfoCard>

//         <InfoCard title={isTradesperson ? "Location Information" : "My Address"} icon={MapPin}>
//           {!isTradesperson && (
//             <div className="md:col-span-2">
//               <ProfileDataItem label="Address" value={location?.address} />
//             </div>
//           )}
//           <ProfileDataItem label="Town/City" value={location?.town} />
//           <ProfileDataItem label="Postcode" value={location?.postcode} />
//           {isTradesperson && (
//             <div className="md:col-span-2">
//               <ProfileDataItem label="Service Areas" value={serviceAreas} />
//             </div>
//           )}
//         </InfoCard>
//       </div>

//       {/* Certifications */}
//       {isTradesperson && <DashboardCertificationList certifications={certifications || []} />}

//       {/* Tradesperson expertise + portfolio */}
//       {isTradesperson && (
//         <Card>
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <Wrench className="h-5 w-5 text-primary" />
//               Expertise & Services
//             </CardTitle>
//             <CardDescription>Details about your skills and business that customers will see.</CardDescription>
//           </CardHeader>

//           <CardContent className="space-y-4">
//             {/* Specialties */}
//             <div>
//               <label className="text-sm font-medium text-muted-foreground">Services you Offer</label>
//               <div className="flex flex-wrap gap-2 mt-2">
//                 {specialties && specialties.length > 0 ? (
//                   specialties.map(s => (
//                     <Badge key={s} variant="secondary">
//                       {s}
//                     </Badge>
//                   ))
//                 ) : (
//                   <p className="text-lg text-muted-foreground italic">Not provided</p>
//                 )}
//               </div>
//             </div>

//             {/* Service types (derived categories used for matching jobs) */}
//             {serviceTypes.length > 0 && (
//               <div>
//                 <label className="text-sm font-medium text-muted-foreground">Services used for matching</label>
//                 <div className="flex flex-wrap gap-2 mt-2">
//                   {serviceTypes.map(st => (
//                     <Badge key={st} variant="outline">
//                       {st}
//                     </Badge>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Experience / rate */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
//               <ProfileDataItem label="Years of Experience" value={experience ? `${experience} years` : undefined} />
//               <ProfileDataItem label="Hourly Rate" value={hourlyRate ? `£${hourlyRate}` : undefined} />
//             </div>

//             {/* About */}
//             <div className="md:col-span-2">
//               <label className="text-sm font-medium text-muted-foreground">About</label>
//               {description ? (
//                 <p className="text-lg text-foreground whitespace-pre-wrap">{description}</p>
//               ) : (
//                 <p className="text-lg text-muted-foreground italic">Not provided</p>
//               )}
//             </div>

//             {/* Portfolio — gated with a friendly fallback */}
//             <div className="md:col-span-2">
//               <div className="flex items-center gap-2">
//                 <FolderKanban className="h-5 w-5 text-muted-foreground" />
//                 <label className="text-sm font-medium text-muted-foreground">Portfolio</label>
//               </div>

//               <SubscriptionGuard
//                 allowedTiers={["pro", "business"]}
//                 tierOverride={subjectTier}
//                 fallback={
//                   <div className="mt-2 space-y-3">
//                     {portfolio && portfolio.length > 0 ? (
//                       <div className="relative">
//                         <Carousel className="w-full mt-2">
//                           <CarouselContent className="opacity-75 blur-[2px] pointer-events-none">
//                             {portfolio.map((img, idx) => (
//                               <CarouselItem key={idx} className="basis-1/2 md:basis-1/3">
//                                 <div className="p-1">
//                                   <div className="relative aspect-[4/3] overflow-hidden rounded-md">
//                                     <Image
//                                       src={img || "/placeholder.svg"}
//                                       alt={`Portfolio image ${idx + 1}`}
//                                       fill
//                                       className="object-cover"
//                                       sizes="(max-width: 768px) 50vw, 33vw"
//                                     />
//                                   </div>
//                                 </div>
//                               </CarouselItem>
//                             ))}
//                           </CarouselContent>
//                           <CarouselPrevious className="hidden sm:flex" />
//                           <CarouselNext className="hidden sm:flex" />
//                         </Carousel>
//                       </div>
//                     ) : (
//                       <p className="text-lg text-muted-foreground italic">Not provided</p>
//                     )}

//                     <div className="flex items-start gap-3 rounded-md border border-dashed p-3">
//                       <Lock className="h-4 w-4 mt-0.5 text-muted-foreground" />
//                       <div className="space-y-1">
//                         <p className="text-sm">
//                           Upgrade to <strong>Pro</strong> or <strong>Business</strong> to display your portfolio on your
//                           public profile.
//                         </p>
//                         <div className="flex items-center gap-2">
//                           <Button asChild size="sm">
//                             <Link href="/pricing">Upgrade plan</Link>
//                           </Button>
//                           <span className="text-xs text-muted-foreground">
//                             You can still add images from the edit page — customers won’t see them until you upgrade.
//                           </span>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 }>
//                 {/* Visible to Pro/Business */}
//                 {portfolio && portfolio.length > 0 ? (
//                   <Carousel className="w-full mt-2">
//                     <CarouselContent>
//                       {portfolio.map((img, idx) => (
//                         <CarouselItem key={idx} className="basis-1/2 md:basis-1/3">
//                           <div className="p-1">
//                             <div className="relative aspect-[4/3] overflow-hidden rounded-md">
//                               <Image
//                                 src={img || "/placeholder.svg"}
//                                 alt={`Portfolio image ${idx + 1}`}
//                                 fill
//                                 unoptimized
//                                 className="object-cover"
//                                 sizes="(max-width: 768px) 50vw, 33vw"
//                               />
//                             </div>
//                           </div>
//                         </CarouselItem>
//                       ))}
//                     </CarouselContent>
//                     <CarouselPrevious className="hidden sm:flex" />
//                     <CarouselNext className="hidden sm:flex" />
//                   </Carousel>
//                 ) : (
//                   <p className="text-lg text-muted-foreground italic mt-2">Not provided</p>
//                 )}
//               </SubscriptionGuard>
//             </div>
//           </CardContent>
//         </Card>
//       )}

//       {/* Account activity */}
//       <InfoCard title="Account Activity" icon={Calendar}>
//         <ProfileDataItem label="Member Since" value={formatDateGB(createdAt)} />
//         {isTradesperson && <ProfileDataItem label="Last Updated" value={formatDateTimeGB(updatedAt)} />}
//         <ProfileDataItem label="Last Login" value={formatDateTimeGB(lastLoginAt)} />
//       </InfoCard>
//     </div>
//   );
// }
// src/components/profile/profile-page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CertificationBadge } from "@/components/certifications/certification-badge";
import { User, MapPin, Edit, Calendar, Wrench, Lock, type LucideIcon, FolderKanban } from "lucide-react";
import type { User as UserType } from "@/lib/types/user";
import SubscriptionGuard from "@/components/auth/subscription-guard";
import { formatDateGB, formatDateTimeGB, getInitials } from "@/lib/utils";
import DashboardCertificationList from "@/components/dashboard/dashboard-certification-list";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import type { JobServiceType } from "@/lib/config/locations";

/** Consistent label/value row */
const ProfileDataItem = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <label className="text-sm font-medium text-muted-foreground">{label}</label>
    {value ? (
      <p className="text-lg text-foreground">{value}</p>
    ) : (
      <p className="text-lg text-muted-foreground italic">Not provided</p>
    )}
  </div>
);

/** Generic section card  */
const InfoCard = ({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">{children}</CardContent>
  </Card>
);

interface ProfilePageProps {
  user: UserType;
  sessionImage?: string | null;
}

export default function EnhancedProfilePage({ user, sessionImage }: ProfilePageProps) {
  const {
    role,
    firstName,
    lastName,
    name,
    email,
    businessName,
    profilePicture,
    onboardingComplete,
    emailVerified,
    phone,
    specialties,
    experience,
    hourlyRate,
    description,
    location,
    serviceAreas,
    portfolio,
    certifications,
    createdAt,
    updatedAt,
    lastLoginAt
  } = user;

  const isTradesperson = role === "tradesperson";
  const subjectTier = (user.subscriptionTier ?? "basic") as "basic" | "pro" | "business";

  const displayName =
    (isTradesperson ? businessName : null) || `${firstName || ""} ${lastName || ""}`.trim() || name || email;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileSlug = (user as any).slug ?? user.id;
  const serviceTypes = (user.serviceTypes ?? []) as JobServiceType[];

  // ✅ LOGIC APPLIED: Handle Fallback & Test Environment
  // Priority: 1. DB Picture -> 2. Session (Google) Picture -> 3. Generic Fallback
  const rawImage = profilePicture || sessionImage;

  const profileImageSrc =
    process.env.NODE_ENV === "test" && (rawImage || "").includes("firebasestorage")
      ? "/images/profile-pics/plumber-generic.webp"
      : rawImage || "/images/profile-pics/plumber-generic.webp";

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="My Profile"
        description="Manage your personal details and account information."
        actions={
          <div className="flex flex-wrap gap-2">
            {isTradesperson && (
              <Button asChild variant="secondary">
                <Link href={`/profile/tradesperson/${profileSlug}`} target="_blank">
                  <User className="h-4 w-4 mr-2" />
                  View Public Profile
                </Link>
              </Button>
            )}
            <Button asChild>
              <Link href={`/dashboard/${role}/profile/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Link>
            </Button>
          </div>
        }
      />

      {/* Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              {/* ✅ Use calculated source here */}
              <AvatarImage src={profileImageSrc} alt={displayName || "User Avatar"} />
              <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <CardTitle className="text-2xl">{displayName}</CardTitle>

              {user.businessName && <p className="text-md text-muted-foreground">{user.businessName}</p>}

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">Role: {role}</Badge>
                <Badge variant={emailVerified ? "default" : "destructive"}>
                  Email: {emailVerified ? "Verified" : "Unverified"}
                </Badge>
                {isTradesperson && onboardingComplete && <Badge variant="default">Profile Complete</Badge>}
                {isTradesperson &&
                  user.certifications
                    ?.filter(c => c.verified)
                    .map(cert => <CertificationBadge key={cert.id} cert={cert} />)}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Info grid */}
      <div className="grid xl:grid-cols-2 gap-6">
        <InfoCard title="Personal Information" icon={User}>
          <ProfileDataItem label="First Name" value={firstName} />
          <ProfileDataItem label="Last Name" value={lastName} />
          <ProfileDataItem label="Email" value={email} />
          <ProfileDataItem label="Phone Number" value={phone} />
        </InfoCard>

        <InfoCard title={isTradesperson ? "Location Information" : "My Address"} icon={MapPin}>
          {!isTradesperson && (
            <div className="md:col-span-2">
              <ProfileDataItem label="Address" value={location?.address} />
            </div>
          )}
          <ProfileDataItem label="Town/City" value={location?.town} />
          <ProfileDataItem label="Postcode" value={location?.postcode} />
          {isTradesperson && (
            <div className="md:col-span-2">
              <ProfileDataItem label="Service Areas" value={serviceAreas} />
            </div>
          )}
        </InfoCard>
      </div>

      {/* Certifications */}
      {isTradesperson && <DashboardCertificationList certifications={certifications || []} />}

      {/* Tradesperson expertise + portfolio */}
      {isTradesperson && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              Expertise & Services
            </CardTitle>
            <CardDescription>Details about your skills and business that customers will see.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Specialties */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Services you Offer</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {specialties && specialties.length > 0 ? (
                  specialties.map(s => (
                    <Badge key={s} variant="secondary">
                      {s}
                    </Badge>
                  ))
                ) : (
                  <p className="text-lg text-muted-foreground italic">Not provided</p>
                )}
              </div>
            </div>

            {/* Service types (derived categories used for matching jobs) */}
            {serviceTypes.length > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Services used for matching</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {serviceTypes.map(st => (
                    <Badge key={st} variant="outline">
                      {st}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Experience / rate */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <ProfileDataItem label="Years of Experience" value={experience ? `${experience} years` : undefined} />
              <ProfileDataItem label="Hourly Rate" value={hourlyRate ? `£${hourlyRate}` : undefined} />
            </div>

            {/* About */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground">About</label>
              {description ? (
                <p className="text-lg text-foreground whitespace-pre-wrap">{description}</p>
              ) : (
                <p className="text-lg text-muted-foreground italic">Not provided</p>
              )}
            </div>

            {/* Portfolio — gated with a friendly fallback */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-muted-foreground" />
                <label className="text-sm font-medium text-muted-foreground">Portfolio</label>
              </div>

              <SubscriptionGuard
                allowedTiers={["pro", "business"]}
                tierOverride={subjectTier}
                fallback={
                  <div className="mt-2 space-y-3">
                    {portfolio && portfolio.length > 0 ? (
                      <div className="relative">
                        <Carousel className="w-full mt-2">
                          <CarouselContent className="opacity-75 blur-[2px] pointer-events-none">
                            {portfolio.map((img, idx) => (
                              <CarouselItem key={idx} className="basis-1/2 md:basis-1/3">
                                <div className="p-1">
                                  <div className="relative aspect-[4/3] overflow-hidden rounded-md">
                                    <Image
                                      src={img || "/placeholder.svg"}
                                      alt={`Portfolio image ${idx + 1}`}
                                      fill
                                      className="object-cover"
                                      sizes="(max-width: 768px) 50vw, 33vw"
                                    />
                                  </div>
                                </div>
                              </CarouselItem>
                            ))}
                          </CarouselContent>
                          <CarouselPrevious className="hidden sm:flex" />
                          <CarouselNext className="hidden sm:flex" />
                        </Carousel>
                      </div>
                    ) : (
                      <p className="text-lg text-muted-foreground italic">Not provided</p>
                    )}

                    <div className="flex items-start gap-3 rounded-md border border-dashed p-3">
                      <Lock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="space-y-1">
                        <p className="text-sm">
                          Upgrade to <strong>Pro</strong> or <strong>Business</strong> to display your portfolio on your
                          public profile.
                        </p>
                        <div className="flex items-center gap-2">
                          <Button asChild size="sm">
                            <Link href="/pricing">Upgrade plan</Link>
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            You can still add images from the edit page — customers won’t see them until you upgrade.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                }>
                {/* Visible to Pro/Business */}
                {portfolio && portfolio.length > 0 ? (
                  <Carousel className="w-full mt-2">
                    <CarouselContent>
                      {portfolio.map((img, idx) => (
                        <CarouselItem key={idx} className="basis-1/2 md:basis-1/3">
                          <div className="p-1">
                            <div className="relative aspect-[4/3] overflow-hidden rounded-md">
                              <Image
                                src={img || "/placeholder.svg"}
                                alt={`Portfolio image ${idx + 1}`}
                                fill
                                unoptimized
                                className="object-cover"
                                sizes="(max-width: 768px) 50vw, 33vw"
                              />
                            </div>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="hidden sm:flex" />
                    <CarouselNext className="hidden sm:flex" />
                  </Carousel>
                ) : (
                  <p className="text-lg text-muted-foreground italic mt-2">Not provided</p>
                )}
              </SubscriptionGuard>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account activity */}
      <InfoCard title="Account Activity" icon={Calendar}>
        <ProfileDataItem label="Member Since" value={formatDateGB(createdAt)} />
        {isTradesperson && <ProfileDataItem label="Last Updated" value={formatDateTimeGB(updatedAt)} />}
        <ProfileDataItem label="Last Login" value={formatDateTimeGB(lastLoginAt)} />
      </InfoCard>
    </div>
  );
}
