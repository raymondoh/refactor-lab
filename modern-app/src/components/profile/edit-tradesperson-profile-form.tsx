// src/components/profile/edit-tradesperson-profile-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, type ChangeEvent } from "react";
import type { User } from "@/lib/types/user";
import type { Certification } from "@/lib/types/certification";
import { tradespersonProfileSchema } from "@/lib/schemas/tradesperson-schema";
import { ALL_SERVICES as predefinedSpecialties, JOB_SERVICE_TYPES, type JobServiceType } from "@/lib/config/locations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as ProfileAvatar, Briefcase, MapPin, Wrench, X, Images, BadgeCheck, Bell, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { storageService } from "@/lib/services/storage-service";
import { ensureFirebaseAuth } from "@/lib/firebase/client";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import type { Session } from "next-auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CERTIFICATIONS, CERTIFICATION_IDS, type CertificationId } from "@/lib/constants/certifications";
import { clientLogger } from "@/lib/utils/logger";

const parseDateValue = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) {
    return value;
  }

  const parsed = new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normaliseCertificationResponse = (raw: unknown): Certification => {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid certification payload");
  }

  const cert = raw as Record<string, unknown>;

  const id = cert.id;
  const nameValue = cert.name;
  const issuingBody = cert.issuingBody;

  if (typeof id !== "string" || !id) {
    throw new Error("Certification payload missing id");
  }

  if (typeof nameValue !== "string" || !nameValue) {
    throw new Error("Certification payload missing name");
  }

  if (typeof issuingBody !== "string" || !issuingBody) {
    throw new Error("Certification payload missing issuing body");
  }

  const metadataRaw = cert.metadata as Record<string, string | null> | undefined | null;
  const verificationRaw = (cert.verification ?? null) as
    | (Certification["verification"] & { checkedAt?: unknown })
    | null;

  const normalizedVerification = verificationRaw
    ? {
        ...verificationRaw,
        checkedAt: parseDateValue(verificationRaw.checkedAt) ?? new Date()
      }
    : null;

  const fileUrlValue = typeof cert.fileUrl === "string" ? cert.fileUrl : null;

  const verifiedByValue =
    typeof cert.verifiedBy === "string" ? cert.verifiedBy : cert.verifiedBy === null ? null : undefined;

  const normalized: Certification = {
    id,
    name: nameValue,
    issuingBody,
    metadata: metadataRaw ?? {},
    fileUrl: fileUrlValue,
    verified: Boolean(cert.verified),
    verifiedAt: parseDateValue(cert.verifiedAt),
    verification: normalizedVerification
  };

  if (verifiedByValue !== undefined) {
    normalized.verifiedBy = verifiedByValue;
  }

  return normalized;
};

// Simplified type definition now that schema includes serviceType
type FormData = z.infer<typeof tradespersonProfileSchema>;

export function EditTradespersonProfileForm({ user }: { user: User }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  const initialProfileImage = user.profilePicture || user.image || null;
  const [imagePreview, setImagePreview] = useState<string | null>(initialProfileImage);
  const [portfolioImages, setPortfolioImages] = useState<string[]>(user.portfolio || []);
  const { data: session, update } = useSession();
  const currentTier = (session?.user?.subscriptionTier ?? "basic") as "basic" | "pro" | "business";
  const otherSpecialtyValue = user.specialties?.find(s => !predefinedSpecialties.includes(s) && s !== "Other") || "";
  const [selectedBody, setSelectedBody] = useState<CertificationId | "">("");
  const [selectedQualification, setSelectedQualification] = useState("");
  const [certMetadata, setCertMetadata] = useState<Record<string, string>>({});
  const [certifications, setCertifications] = useState<Certification[]>(() => {
    try {
      return (user.certifications || []).map(normaliseCertificationResponse);
    } catch (error) {
      clientLogger.error("[v0] Certification normalisation error:", error);
      return user.certifications || [];
    }
  });
  const [isUploadingOrModifying, setIsUploadingOrModifying] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(tradespersonProfileSchema),
    defaultValues: {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phone: user.phone || "",
      postcode: user.location?.postcode || "",
      town: user.location?.town || "",
      address: user.location?.address || "",
      businessName: user.businessName || "",
      googleBusinessProfileUrl: user.googleBusinessProfileUrl || "",
      serviceAreas: user.serviceAreas || "",
      specialties: user.specialties || [],
      otherSpecialty: otherSpecialtyValue,
      experience: user.experience || "",
      description: user.description || "",
      hourlyRate: user.hourlyRate || "",
      profilePicture: initialProfileImage || "",
      portfolio: user.portfolio || [],
      notificationSettings: {
        newJobAlerts: user.notificationSettings?.newJobAlerts ?? true
      },
      // Now accessing user.serviceType is valid because we updated the User type
      serviceType: (user.serviceType as JobServiceType) ?? JOB_SERVICE_TYPES[0]
    }
  });

  useEffect(() => {
    form.setValue("portfolio", portfolioImages);
  }, [portfolioImages, form]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const authUser = await ensureFirebaseAuth();
    if (!authUser) {
      toast.error("Please sign in again to upload images.");
      return;
    }

    setIsUploadingOrModifying(true);
    try {
      const path = `users/${user.id}/profilePicture/${Date.now()}-${file.name}`;
      const downloadURL = await storageService.uploadFile(file, path);
      setImagePreview(downloadURL);
      form.setValue("profilePicture", downloadURL);
    } catch (error) {
      clientLogger.error("[v0] Profile picture upload error:", error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploadingOrModifying(false);
    }
  };

  const handlePortfolioChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const authUser = await ensureFirebaseAuth();
    if (!authUser) {
      toast.error("Please sign in again to upload images.");
      return;
    }

    setIsUploadingOrModifying(true);

    try {
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`File "${file.name}" is too large. Max size is 5MB.`);
          continue;
        }

        let currentPortfolio = form.getValues("portfolio") || [];
        if (currentPortfolio.length >= 10) {
          toast.error("You can upload a maximum of 10 portfolio images.");
          break;
        }

        toast.info(`Uploading "${file.name}"...`);
        try {
          const path = `users/${user.id}/portfolio/${Date.now()}-${file.name}`;
          const downloadURL = await storageService.uploadFile(file, path);

          currentPortfolio = [...currentPortfolio, downloadURL];
          setPortfolioImages(currentPortfolio);
          form.setValue("portfolio", currentPortfolio);

          toast.success(`"${file.name}" uploaded successfully.`);
        } catch (error) {
          clientLogger.error(`[v0] Portfolio upload error for ${file.name}:`, error);
          toast.error(`Failed to upload "${file.name}". Please try again.`);
        }
      }
    } finally {
      event.target.value = "";
      setIsUploadingOrModifying(false);
    }
  };

  const handleCertificationFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!selectedBody) {
      toast.error("Please select a certification body.");
      (event.target as HTMLInputElement).value = "";
      return;
    }
    if (!selectedQualification) {
      toast.error("Please select a qualification.");
      (event.target as HTMLInputElement).value = "";
      return;
    }

    const formPayload = new FormData();
    formPayload.append("file", file);
    formPayload.append("issuingBody", selectedBody);
    formPayload.append("name", selectedQualification);
    formPayload.append("metadata", JSON.stringify(certMetadata));

    setIsUploadingOrModifying(true);

    try {
      const response = await fetch("/api/certifications", {
        method: "POST",
        body: formPayload
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to upload certification.");
      }

      if (!result.certification) {
        throw new Error("Invalid response from certification upload.");
      }

      const newCertification = normaliseCertificationResponse(result.certification);
      setCertifications(prev => [...prev, newCertification]);

      const successMessage = newCertification.verified
        ? "Certification verified automatically!"
        : newCertification.verification?.method === "manual"
          ? "Certification uploaded. We'll review it shortly."
          : "Certification uploaded. Verification pending.";

      toast.success(successMessage);
      setSelectedBody("");
      setSelectedQualification("");
      setCertMetadata({});
    } catch (error) {
      clientLogger.error("[v0] Certification upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload certification. Please try again.");
    } finally {
      (event.target as HTMLInputElement).value = "";
      setIsUploadingOrModifying(false);
    }
  };

  const removeCertification = async (index: number) => {
    const cert = certifications[index];
    if (!cert) return;

    const previous = [...certifications];

    setIsUploadingOrModifying(true);

    try {
      if (cert.fileUrl) {
        try {
          await storageService.deleteFile(cert.fileUrl);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (!message.includes("object-not-found")) {
            clientLogger.error("[v0] Certification delete error:", error);
            toast.error("Failed to delete certification file. Please try again.");
            throw error;
          }
        }
      }

      const updated = certifications.filter((_, i) => i !== index);
      setCertifications(updated);

      try {
        const response = await fetch("/api/certifications", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ certifications: updated })
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Failed to update certifications.");
        }

        if (Array.isArray(result.certifications)) {
          const normalised = result.certifications.map((item: unknown) => {
            try {
              return normaliseCertificationResponse(item);
            } catch (error) {
              clientLogger.error("[v0] Certification normalisation error:", error);
              return item as Certification;
            }
          });
          setCertifications(normalised);
        }

        toast.success("Certification removed.");
      } catch (apiError) {
        clientLogger.error("[v0] Certification remove (API) error:", apiError);
        setCertifications(previous);
        toast.error(apiError instanceof Error ? apiError.message : "Failed to remove certification. Please try again.");
      }
    } catch {
      // already handled
    } finally {
      setIsUploadingOrModifying(false);
    }
  };

  const removePortfolioImage = async (index: number) => {
    const imageUrl = portfolioImages[index];
    if (!imageUrl) return;

    setIsUploadingOrModifying(true);

    try {
      await storageService.deleteFile(imageUrl);

      const updated = portfolioImages.filter((_, i) => i !== index);
      setPortfolioImages(updated);
      form.setValue("portfolio", updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("object-not-found")) {
        clientLogger.error("[v0] Portfolio delete error:", error);
        toast.error("Failed to delete image. Please try again.");
        return;
      }

      const updated = portfolioImages.filter((_, i) => i !== index);
      setPortfolioImages(updated);
      form.setValue("portfolio", updated);
    } finally {
      setIsUploadingOrModifying(false);
    }
  };

  const onSubmit = useCallback(
    async (data: FormData) => {
      // 🔒 Require phone number for tradespeople
      if (!data.phone || !data.phone.trim()) {
        toast.error("Please enter a contact phone number before saving your profile.");
        return;
      }
      // 🔒 Require postcode
      if (!data.postcode || !data.postcode.trim()) {
        toast.error("Please enter your postcode before saving your profile.");
        return;
      }
      if (!data.town || !data.town.trim()) {
        toast.error("Please enter your town/city before saving your profile.");
        return;
      }

      if (isUploadingOrModifying) {
        setPendingSubmit(true);
        toast.info("Finishing your uploads, then we’ll save your profile…");
        return;
      }

      setPendingSubmit(false);
      setIsSubmitting(true);
      toast.info("Saving your profile...");

      try {
        const finalSpecialties = [...data.specialties];
        if (data.specialties.includes("Other") && data.otherSpecialty) {
          const index = finalSpecialties.indexOf("Other");
          finalSpecialties.splice(index, 1, data.otherSpecialty);
        }

        const submissionData = {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          businessName: data.businessName,
          googleBusinessProfileUrl: data.googleBusinessProfileUrl?.trim() || null,
          serviceAreas: data.serviceAreas,
          experience: data.experience,
          description: data.description,
          hourlyRate: data.hourlyRate,
          profilePicture: data.profilePicture,
          portfolio: data.portfolio,
          certifications,
          specialties: finalSpecialties,
          notificationSettings: {
            newJobAlerts: data.notificationSettings?.newJobAlerts ?? true
          },
          postcode: data.postcode,
          town: data.town,
          address: data.address,
          // NEW: persist primary service type
          serviceType: data.serviceType as JobServiceType
        };

        const response = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submissionData)
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "An unknown error occurred.");
        }

        toast.success("Profile saved successfully!");

        const updatedName =
          result.user.name ||
          [result.user.firstName, result.user.lastName].filter(Boolean).join(" ") ||
          user.name ||
          "";
        const updatedImage = result.user.profilePicture || result.user.image || null;

        const nextUser = {
          ...(session?.user ?? {}),
          name: updatedName
        } as Session["user"];

        nextUser.image = updatedImage;

        await update({ user: nextUser });

        router.push("/dashboard/tradesperson?profile_saved=true");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Submission failed.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [isUploadingOrModifying, certifications, user.name, session, update, router]
  );

  useEffect(() => {
    if (!isUploadingOrModifying && pendingSubmit) {
      form.handleSubmit(onSubmit)();
    }
  }, [isUploadingOrModifying, pendingSubmit, form, onSubmit]);

  const selectedSpecialties = form.watch("specialties");

  const firstName = form.watch("firstName");
  const lastName = form.watch("lastName");
  const fallbackInitials = (() => {
    const firstInitial = firstName?.trim()?.[0];
    const lastInitial = lastName?.trim()?.[0];
    if (firstInitial || lastInitial) {
      return `${firstInitial ?? ""}${lastInitial ?? ""}`.toUpperCase();
    }

    if (user.name) {
      const nameInitials = user.name
        .split(" ")
        .filter(Boolean)
        .map(part => part[0]?.toUpperCase())
        .join("");
      if (nameInitials) return nameInitials;
    }

    if (user.email) {
      return user.email[0]?.toUpperCase() ?? null;
    }

    return null;
  })();

  const avatarAltText =
    [firstName?.trim(), lastName?.trim()].filter(Boolean).join(" ") ||
    user.name ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.email ||
    "Profile picture";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Your Professional Profile</CardTitle>
            <CardDescription>
              This information will be visible to customers and helps you win more jobs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* --- Business & Contact Section --- */}
            <div className="space-y-6">
              <h3 className="font-medium flex items-center gap-2 text-xl">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                Business & Contact
              </h3>

              <FormField
                control={form.control}
                name="profilePicture"
                render={() => (
                  <FormItem>
                    <FormLabel className="form-label-lg">Profile Picture</FormLabel>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={imagePreview || ""} alt={avatarAltText} />
                        <AvatarFallback className="text-3xl font-semibold">
                          {fallbackInitials ?? <ProfileAvatar className="h-12 w-12" />}
                        </AvatarFallback>
                      </Avatar>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/png, image/jpeg, image/webp"
                          onChange={handleFileChange}
                          className="max-w-xs"
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="form-label-lg">First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="form-label-lg">Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label-lg">Business Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Smith's Plumbing" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="googleBusinessProfileUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label-lg">Google Business Profile URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Paste your Google review link here..." {...field} />
                    </FormControl>
                    <FormDescription>
                      This will allow customers to easily leave you a Google Review after they've reviewed you on our
                      platform.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="form-label-lg">
                        Contact Phone <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 07123 456789" {...field} />
                      </FormControl>
                      <FormDescription>
                        This number is required and will be shared with customers once a job is confirmed.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hourlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="form-label-lg">Indicative Hourly Rate (£, Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* --- Location & Service Area Section --- */}
            <div className="space-y-6">
              <h3 className="font-medium flex items-center gap-2 text-xl">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                Location & Service Area
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="form-label-lg">Address (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 123 High Street" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="town"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="form-label-lg">
                        Town/City <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., London" {...field} />
                      </FormControl>
                      <FormDescription>
                        Used to show your profile in the right city and match you with local jobs. Changing this may
                        affect where you appear to customers.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="postcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="form-label-lg">
                        Postcode <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., SW1A 1AA" {...field} />
                      </FormControl>
                      <FormDescription>
                        Used for location-based matching and job alerts. Make sure this reflects where you actually work
                        from.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="serviceAreas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label-lg">Service Areas</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Central London, Surrey, Kent" {...field} />
                    </FormControl>
                    <FormDescription>
                      List the areas you cover, separated by commas (e.g. "North London, West London"). Updating this
                      will change which jobs you receive alerts for.
                    </FormDescription>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* --- Expertise Section --- */}
            <div className="space-y-6">
              <h3 className="font-medium flex items-center gap-2 text-xl">
                <Wrench className="h-5 w-5 text-muted-foreground" />
                Your Expertise
              </h3>

              {/* Primary service type using JOB_SERVICE_TYPES */}
              <FormField
                control={form.control}
                name="serviceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label-lg">
                      Primary Service Type <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <select
                        value={field.value ?? ""}
                        onChange={e => field.onChange(e.target.value as JobServiceType)}
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                        <option value="">Select your primary service</option>
                        {JOB_SERVICE_TYPES.map(type => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormDescription>
                      This is your main service and is used for job matching (alongside your specialties).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specialties"
                render={() => (
                  <FormItem>
                    <FormLabel className="form-label-lg">Services You Offer</FormLabel>
                    <FormDescription>
                      These service types are used to match you with the right jobs (e.g. General Plumbing, Gas &amp;
                      Heating, Boilers).
                    </FormDescription>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {predefinedSpecialties.map(item => (
                        <FormField
                          key={item}
                          control={form.control}
                          name="specialties"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item)}
                                  onCheckedChange={checked => {
                                    return checked
                                      ? field.onChange([...(field.value ?? []), item])
                                      : field.onChange(field.value?.filter((value: string) => value !== item));
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">{item}</FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}

                      <FormField
                        control={form.control}
                        name="specialties"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes("Other")}
                                onCheckedChange={checked => {
                                  return checked
                                    ? field.onChange([...(field.value ?? []), "Other"])
                                    : field.onChange(field.value?.filter((value: string) => value !== "Other"));
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Other</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedSpecialties?.includes("Other") && (
                <FormField
                  control={form.control}
                  name="otherSpecialty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="form-label-lg">If other, please specify</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Underfloor Heating" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label-lg">Years of Experience</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                        <option value="">Select years of experience</option>
                        <option value="0-1">0 - 1 years</option>
                        <option value="1-3">1 - 3 years</option>
                        <option value="3-5">3 - 5 years</option>
                        <option value="5-10">5 - 10 years</option>
                        <option value="10+">10+ years</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label-lg">Profile Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={5}
                        placeholder="Tell customers about your business, the services you offer, and your qualifications..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* --- Certifications Section --- */}
            <div className="space-y-6">
              <h3 className="font-medium flex items-center gap-2 text-xl">
                <BadgeCheck className="h-5 w-5 text-muted-foreground" />
                Certifications
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <FormLabel className="form-label-lg">Issuing Body</FormLabel>
                  <select
                    value={selectedBody}
                    onChange={e => {
                      const value = e.target.value as CertificationId | "";
                      setSelectedBody(value);
                      setSelectedQualification("");
                      setCertMetadata({});
                    }}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <option value="">Select issuing body</option>
                    {CERTIFICATION_IDS.map(id => (
                      <option key={id} value={id}>
                        {CERTIFICATIONS[id].label}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedBody && (
                  <div className="space-y-2">
                    <FormLabel className="form-label-lg">Qualification</FormLabel>
                    <select
                      value={selectedQualification}
                      onChange={e => setSelectedQualification(e.target.value)}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                      <option value="">Select qualification</option>
                      {CERTIFICATIONS[selectedBody].qualifications.map(q => (
                        <option key={q} value={q}>
                          {q}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {selectedBody &&
                CERTIFICATIONS[selectedBody].requiredFields?.map(field => (
                  <div key={field.id} className="md:w-1/2">
                    <FormLabel className="form-label-lg">{field.label}</FormLabel>
                    <Input
                      value={certMetadata[field.id] || ""}
                      onChange={e => setCertMetadata(prev => ({ ...prev, [field.id]: e.target.value }))}
                    />
                  </div>
                ))}

              <div className="md:w-1/2">
                <FormLabel className="form-label-lg">Upload Certificate</FormLabel>
                <Input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={handleCertificationFileChange}
                />
              </div>

              {certifications.length > 0 && (
                <div className="flex flex-wrap gap-4 mt-4">
                  {certifications.map((cert, idx) => (
                    <div key={cert.id} className="relative">
                      <a href={cert.fileUrl || "#"} target="_blank" rel="noopener noreferrer">
                        <div className="flex h-28 w-28 flex-col items-center justify-center gap-2 rounded border p-2 text-center text-xs">
                          <span className="font-medium line-clamp-3">{cert.name}</span>
                          <Badge
                            variant={cert.verified ? "default" : "secondary"}
                            className={`w-full justify-center ${
                              cert.verified
                                ? "bg-emerald-500 text-emerald-50 hover:bg-emerald-500"
                                : "bg-amber-500/20 text-amber-700 hover:bg-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
                            }`}>
                            {cert.verified && <BadgeCheck className="h-3 w-3" />}
                            {cert.verified ? "Verified" : "Pending review"}
                          </Badge>
                          {cert.verification?.method && (
                            <span className="text-[10px] text-muted-foreground">
                              {cert.verified
                                ? cert.verification.method === "api"
                                  ? "Auto-verified"
                                  : "Verified manually"
                                : cert.verification.method === "api"
                                  ? "API check pending"
                                  : "Manual review required"}
                            </span>
                          )}
                        </div>
                      </a>
                      <button
                        type="button"
                        onClick={() => removeCertification(idx)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                        aria-label={`Remove certificate ${idx + 1}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* --- Notification Settings --- */}
            <div className="space-y-6">
              <h3 className="font-medium flex items-center gap-2 text-xl">
                <Bell className="h-5 w-5 text-muted-foreground" />
                Notification Settings
              </h3>

              <FormField
                control={form.control}
                name="notificationSettings.newJobAlerts"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="form-label-lg">New Job Alerts</FormLabel>
                      <FormDescription>
                        Receive an email when a new job is posted in your service area that matches your skills.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={field.value ?? false}
                        onCheckedChange={checked => field.onChange(checked === true)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* --- Portfolio Section --- */}
            <div className="space-y-6">
              <h3 className="font-medium flex items-center gap-2 text-xl">
                <Images className="h-5 w-5 text-muted-foreground" />
                Portfolio
              </h3>

              {currentTier === "basic" && (
                <Alert className="border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300">
                  <AlertDescription>
                    You can upload and manage your portfolio here. On the <strong>Basic</strong> plan, your gallery
                    isn’t shown on your public profile. Upgrade to <strong>Pro</strong> to showcase your work.{" "}
                    <Link href="/pricing" className="underline">
                      See plans
                    </Link>
                  </AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="portfolio"
                render={() => (
                  <FormItem>
                    <FormLabel className="form-label-lg">Upload Images of Your Work</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        multiple
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handlePortfolioChange}
                      />
                    </FormControl>

                    {portfolioImages.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-4">
                        {portfolioImages.map((img, idx) => (
                          <div key={idx} className="relative h-24 w-24">
                            <Image
                              src={img || "/placeholder.svg"}
                              alt={`Portfolio image ${idx + 1}`}
                              fill
                              className="object-cover rounded-md"
                              sizes="96px"
                            />
                            <Button
                              type="button"
                              variant="danger"
                              size="icon"
                              onClick={() => removePortfolioImage(idx)}
                              className="absolute top-1 right-1 h-6 w-6 rounded-full z-10"
                              aria-label={`Remove portfolio image ${idx + 1}`}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-2">
            <Button variant="subtle" asChild>
              <Link href="/dashboard/tradesperson/profile">
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {(isSubmitting || isUploadingOrModifying) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Saving..." : isUploadingOrModifying ? "Finishing uploads…" : "Save and Update Profile"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
