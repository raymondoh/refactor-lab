// src/components/jobs/create-job-form.tsx
"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { zodResolver } from "@hookform/resolvers/zod";
import { jobFormSchema, type JobFormValues, serviceTypes, urgencyOptions } from "@/lib/schemas/job-form-schema";

import { toast } from "sonner";
import type { User } from "@/lib/types/user";
import Image from "next/image";

import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, MapPin, Wrench, CalendarDays, Images, PoundSterling, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";

import { storageService } from "@/lib/services/storage-service";
import { clientLogger } from "@/lib/utils/logger";
import type { JobServiceType } from "@/lib/config/locations";

const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB

// Strongly-typed payload sent to /api/jobs
interface CreateJobPayload {
  title: string;
  description: string;
  urgency: "emergency" | "urgent" | "soon" | "flexible";
  location: {
    postcode: string;
    address?: string;
    town?: string;
  };
  customerContact: {
    name: string;
    email: string;
    phone: string | null;
  };
  serviceType: JobServiceType;
  recaptchaToken: string;
  budget?: number;
  scheduledDate?: string;
  photos?: string[];
}

export function CreateJobForm({ user }: { user: User }) {
  const router = useRouter();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: "",
      description: "",
      postcode: user.location?.postcode || "",
      address: user.location?.address || "",
      town: user.location?.town || "",
      urgency: "flexible",
      budget: "",
      // We start empty so the user must choose one.
      // If JobFormValues.serviceType is narrower, this can be cast:
      serviceType: "" as JobFormValues["serviceType"],
      preferredDate: "",
      photos: []
    }
  });

  clientLogger.info("User in CreateJobForm:", user);

  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setIsUploading(true);
    let currentPhotos = form.getValues("photos") || [];

    try {
      for (const file of files) {
        if (currentPhotos.length >= 5) {
          toast.error("You can upload up to 5 photos.");
          break;
        }

        if (file.size > MAX_PHOTO_SIZE) {
          toast.error("Image file is too large. Please select a file under 5MB.");
          form.setError("photos", { type: "manual", message: "File too large" });
          continue;
        }

        form.clearErrors("photos");

        try {
          toast.info("Uploading image...");
          const path = `jobs/${user.id}/${Date.now()}-${file.name}`;
          const downloadURL = await storageService.uploadFile(file, path);

          currentPhotos = [...currentPhotos, downloadURL];
          setPhotoPreviews(prev => [...prev, downloadURL]);
          form.setValue("photos", currentPhotos);
          toast.success("Image uploaded successfully.");
        } catch (error) {
          clientLogger.error("Photo upload error:", error);
          toast.error("Failed to upload image. Please try again.");
        }
      }
    } finally {
      event.target.value = "";
      setIsUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    const updatedPreviews = photoPreviews.filter((_, i) => i !== index);
    setPhotoPreviews(updatedPreviews);
    form.setValue("photos", updatedPreviews);
  };

  async function onSubmit(values: JobFormValues) {
    if (isUploading) {
      toast.error("Please wait for images to finish uploading.");
      return;
    }

    if (!executeRecaptcha) {
      toast.error("reCAPTCHA is still loading. Please try again in a moment.");
      return;
    }

    let recaptchaToken: string | null = null;

    try {
      recaptchaToken = await executeRecaptcha("create_job");
    } catch (error) {
      clientLogger.error("[create-job] executeRecaptcha error", error);
      toast.error("Could not verify reCAPTCHA. Please try again.");
      return;
    }

    if (!recaptchaToken) {
      toast.error("Could not verify reCAPTCHA. Please try again.");
      return;
    }

    // ✅ NEW: ensure user.email is present and narrow it to `string`
    if (!user.email) {
      clientLogger.error("[create-job] User is missing email", { userId: user.id });
      toast.error("We couldn't find an email address on your account. Please update your profile and try again.");
      return;
    }

    const location: CreateJobPayload["location"] = {
      postcode: values.postcode
    };
    if (values.address) location.address = values.address;
    if (values.town) location.town = values.town;

    const payload: CreateJobPayload = {
      title: values.title,
      description: values.description,
      urgency: values.urgency,
      location,
      customerContact: {
        name: user.name || `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Customer",
        email: user.email, // ✅ now safely a `string`
        phone: user.phone || null
      },
      serviceType: values.serviceType as JobServiceType,
      recaptchaToken
    };

    if (values.budget) {
      payload.budget = Number(values.budget);
    }

    if (values.preferredDate) {
      payload.scheduledDate = values.preferredDate;
    }

    if (values.photos && values.photos.length) {
      payload.photos = values.photos;
    }

    try {
      toast.info("Posting your job...");
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to create job");
      }

      router.push("/dashboard/customer/jobs?job_posted=true");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Post a New Job</CardTitle>
        <CardDescription>
          Tell us what you need help with and where you are. We&apos;ll notify suitable plumbers so they can send
          quotes.
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-8">
            {/* --- Job Details --- */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2 text-xl">
                <Wrench className="h-5 w-5 text-muted-foreground" />
                Job Details
              </h3>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label-lg">Job Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Leaking Kitchen Tap" {...field} />
                    </FormControl>
                    <FormDescription>Provide a short, clear title for the job.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label-lg">Job Description</FormLabel>
                    <FormControl>
                      <Textarea
                        className="min-h-32"
                        placeholder="Describe the issue, where it is, when it started, and anything you've already tried..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A clear description helps tradespeople give accurate quotes and arrive prepared.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* --- Location --- */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2 text-xl">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                Location
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="town"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="form-label-lg">Town/City</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., London" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="postcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="form-label-lg">Postcode</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., SW1A 1AA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
              </div>
            </div>

            <Separator />

            {/* --- Timing & Budget --- */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2 text-xl">
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
                Timing & Budget
              </h3>

              <FormField
                control={form.control}
                name="urgency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label-lg">Urgency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select urgency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {urgencyOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="form-label-lg flex items-center gap-1">
                        <PoundSterling className="h-4 w-4 text-muted-foreground" />
                        Budget (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input type="number" min="0" placeholder="e.g., 150" {...field} />
                      </FormControl>
                      <FormDescription>Helps tradespeople give a more accurate quote.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferredDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="form-label-lg">Preferred Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="serviceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label-lg">
                      Service Type <span className="text-destructive">*</span>
                    </FormLabel>

                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select service type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {serviceTypes.map(type => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* --- Photos --- */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2 text-xl">
                <Images className="h-5 w-5 text-muted-foreground" />
                Photos
              </h3>

              <FormField
                control={form.control}
                name="photos"
                render={() => (
                  <FormItem>
                    <FormLabel className="form-label-lg">Photos (Optional)</FormLabel>
                    <FormDescription>
                      Upload images to help tradespeople understand the job.
                      {isUploading && <span className="ml-2 text-xs text-muted-foreground">Uploading images…</span>}
                    </FormDescription>

                    <FormControl>
                      <Input
                        type="file"
                        multiple
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handlePhotoChange}
                        className="mt-2"
                      />
                    </FormControl>

                    {photoPreviews.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {photoPreviews.map((src, idx) => (
                          <div key={idx} className="relative h-20 w-20">
                            <Image
                              src={src}
                              alt={`Job photo ${idx + 1}`}
                              width={80}
                              height={80}
                              className="h-full w-full object-cover rounded"
                              sizes="80px"
                            />
                            <Button
                              type="button"
                              variant="danger"
                              size="icon"
                              className="absolute -top-2 -right-2 h-5 w-5 rounded-full border border-white"
                              onClick={() => removePhoto(idx)}
                              aria-label="Remove photo">
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

          <CardFooter className="flex justify-end gap-2 pt-6">
            <Button type="button" variant="subtle" onClick={() => router.push("/dashboard/customer/jobs")}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting || isUploading}>
              {(form.formState.isSubmitting || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {form.formState.isSubmitting ? "Posting Job..." : isUploading ? "Uploading Image..." : "Post Job"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
