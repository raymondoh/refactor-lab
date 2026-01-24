// src/components/profile/edit-profile-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent } from "react";
import type { Session } from "next-auth";
import type { User } from "@/lib/types/user";
import Link from "next/link";
import type { z } from "zod";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, User as UserIcon, MapPin, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { storageService } from "@/lib/services/storage-service";
import { ensureFirebaseAuth } from "@/lib/firebase/client";
import { customerProfileSchema } from "@/lib/schemas/customer-schema";
import { clientLogger } from "@/lib/utils/logger";

type FormData = z.infer<typeof customerProfileSchema>;

export function EditProfileForm({ user, backPath }: { user: User; backPath: string }) {
  const router = useRouter();
  const { data: session, update } = useSession();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const initialProfileImage = user.profilePicture || user.image || null;
  const [imagePreview, setImagePreview] = useState<string | null>(initialProfileImage);

  const form = useForm<FormData>({
    resolver: zodResolver(customerProfileSchema),
    defaultValues: {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phone: user.phone || "",
      address: user.location?.address || "",
      town: user.location?.town || "",
      postcode: user.location?.postcode || "",
      profilePicture: initialProfileImage || "",
      businessName: user.businessName || ""
    }
  });

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image file is too large. Please select a file under 2MB.");
      event.target.value = "";
      return;
    }

    const authUser = await ensureFirebaseAuth();
    if (!authUser) {
      toast.error("Please sign in again to upload images.");
      event.target.value = "";
      return;
    }

    setIsUploading(true);
    try {
      toast.info("Uploading image...");
      const path = `users/${user.id}/profilePicture/${Date.now()}-${file.name}`;
      const downloadURL = await storageService.uploadFile(file, path);

      setImagePreview(downloadURL);
      form.setValue("profilePicture", downloadURL);
      toast.success("Image uploaded successfully.");
    } catch (error) {
      clientLogger.error("[EditProfileForm] Profile picture upload error:", error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      event.target.value = "";
      setIsUploading(false);
    }
  };

  async function onSubmit(data: FormData) {
    clientLogger.info("[EditProfileForm] onSubmit triggered");

    if (isUploading) {
      toast.error("Please wait for the image upload to finish.");
      return;
    }

    // 🔒 Require phone number for customers
    if (!data.phone || !data.phone.trim()) {
      toast.error("Please enter a contact phone number before saving your profile.");
      return;
    }

    // 🔒 Require postcode
    if (!data.postcode || !data.postcode.trim()) {
      toast.error("Please enter your postcode before saving your profile.");
      return;
    }

    // 🔒 Require town/city
    if (!data.town || !data.town.trim()) {
      toast.error("Please enter your town/city before saving your profile.");
      return;
    }

    setIsSubmitting(true);

    try {
      const submissionData = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        profilePicture: data.profilePicture,
        businessName: data.businessName || null,
        address: data.address,
        town: data.town,
        postcode: data.postcode
      };

      clientLogger.info("[EditProfileForm] Submitting data:", submissionData);

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData)
      });

      clientLogger.info("[EditProfileForm] Response status:", response.status);
      const result = await response.json().catch(() => null);
      clientLogger.info("[EditProfileForm] Response result:", result);

      if (!response.ok) {
        throw new Error(result?.error || "An error occurred.");
      }

      toast.success("Profile saved successfully!");

      const updatedName =
        result.user.name || [result.user.firstName, result.user.lastName].filter(Boolean).join(" ") || user.name || "";

      const updatedImage = result.user.profilePicture || result.user.image || null;

      const nextUser = {
        ...(session?.user ?? {}),
        name: updatedName
      } as Session["user"];

      nextUser.image = updatedImage;

      await update({ user: nextUser });

      const redirectUrl = new URL(backPath, window.location.origin);
      redirectUrl.searchParams.set("profile_saved", "true");

      router.push(redirectUrl.toString());
      router.refresh();
      clientLogger.info("[EditProfileForm] Profile update successful");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Submission failed.";
      toast.error(message);
      clientLogger.error("[EditProfileForm] Profile update failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

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
            <CardTitle>Update Your Information</CardTitle>
            <CardDescription>
              Make sure your details are correct to ensure a smooth experience on the platform.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Profile picture */}
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
                        {fallbackInitials ?? <UserIcon className="h-12 w-12" />}
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

            <Separator />

            {/* Personal details */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2 text-xl">
                <UserIcon className="h-5 w-5 text-muted-foreground" />
                Personal Details
              </h3>

              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label-lg">Business Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. BB Plumbing Ltd" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormDescription>
                      Optional – useful if you&apos;re booking jobs on behalf of a company or landlord.
                    </FormDescription>

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
                      <FormLabel className="form-label-lg">
                        First Name <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. John" {...field} />
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
                      <FormLabel className="form-label-lg">
                        Last Name <span className="text-destructive">*</span>
                      </FormLabel>

                      <FormControl>
                        <Input placeholder="Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label-lg">
                      Phone Number <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="07123 456789" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormDescription>
                      This number is required so tradespeople can contact you once a job is confirmed. It won&apos;t be
                      shared publicly on your profile.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Location details */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2 text-xl">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                Location Details
              </h3>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label-lg">Address (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="123 High Street" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="town"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="form-label-lg">
                        Town/City <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="London" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormDescription>
                        We use this to show you local tradespeople and jobs near you. Make sure it reflects where the
                        work will usually take place.
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
                        <Input placeholder="SW1A 1AA" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormDescription>
                        Used for location-based matching and travel estimates for tradespeople. Use the postcode where
                        the work will be carried out.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-2">
            <Button variant="subtle" asChild>
              <Link href={backPath}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Link>
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {(isSubmitting || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Saving..." : isUploading ? "Uploading image..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
