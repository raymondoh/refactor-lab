// src/components/auth/UserProfileForm.tsx
"use client";

import type React from "react";
import { useState, useEffect, useRef, startTransition, useActionState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Upload, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

import { firebaseError, isFirebaseError } from "@/utils/firebase-error";
import { uploadFile } from "@/utils/uploadFile";
import { validateFileSize } from "@/utils/validateFileSize";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { UserProfileSkeleton } from "./UserProfileSkeleton";
import { UserAvatar } from "../shared/UserAvatar";
import { updateUserProfile } from "@/actions/user";
import type { ProfileUpdateState, User } from "@/types/user";
import { UniversalInput } from "@/components/forms/UniversalInput";
import { UniversalTextarea } from "@/components/forms/UniversalTextarea";

interface UnifiedProfileFormProps {
  id?: string;
  onCancel?: () => void;
  redirectAfterSuccess?: string;
  isAdmin?: boolean;
  isLoading?: boolean;
  user?: User | null;
}

export function UserProfileForm({ id, onCancel, redirectAfterSuccess, isAdmin = false }: UnifiedProfileFormProps) {
  const { data: session, status, update: updateSessionFn } = useSession();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [formReady, setFormReady] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [initialFirstName, setInitialFirstName] = useState("");
  const [initialLastName, setInitialLastName] = useState("");
  const [initialDisplayName, setInitialDisplayName] = useState("");
  const [initialBio, setInitialBio] = useState("");
  const [initialPhotoURL, setInitialPhotoURL] = useState<string | null>(null);

  const updateProcessedRef = useRef(false);

  const [state, formAction, isPending] = useActionState<ProfileUpdateState, FormData>(updateUserProfile, {
    success: false
  });

  useEffect(() => {
    // Highlight: Log what session data the form receives
    console.log("[UserProfileForm] useEffect: session status =", status);
    console.log("[UserProfileForm] useEffect: session.user =", session?.user);

    if (status === "authenticated" && session?.user && !formReady) {
      setFirstName(session.user.firstName || "");
      setLastName(session.user.lastName || "");
      setDisplayName(session.user.displayName || session.user.name || "");
      setBio(session.user.bio || "");
      setPhotoURL(session.user.image || null);

      setInitialFirstName(session.user.firstName || "");
      setInitialLastName(session.user.lastName || "");
      setInitialDisplayName(session.user.displayName || session.user.name || "");
      setInitialBio(session.user.bio || "");
      setInitialPhotoURL(session.user.image || null);

      setFormReady(true);
      // Highlight: Log form state after initialization
      console.log("[UserProfileForm] useEffect: Form initialized with:");
      console.log("  firstName:", session.user.firstName || "");
      console.log("  lastName:", session.user.lastName || "");
      console.log("  displayName:", session.user.displayName || session.user.name || "");
      console.log("  bio:", session.user.bio || "");
      console.log("  photoURL:", session.user.image || null);
    }
  }, [session, status, formReady]);

  useEffect(() => {
    if (state && !updateProcessedRef.current) {
      if (state.success) {
        updateProcessedRef.current = true;
        setIsSuccess(true);
        toast.success("Profile updated successfully");

        updateSessionFn()
          .then(() => {
            console.log("[UserProfileForm] Session update triggered and completed."); // Highlight
            if (redirectAfterSuccess) {
              setTimeout(() => router.push(redirectAfterSuccess), 1500);
            }
          })
          .catch(error => {
            const message = isFirebaseError(error) ? firebaseError(error) : "Failed to update session";
            toast.error(message);
            console.error("[UserProfileForm] Session update error:", error); // Highlight
          });
      } else if (state.error) {
        const message = typeof state.error === "string" ? state.error : firebaseError(state.error);
        toast.error(message);
        console.error("[UserProfileForm] Form action error:", state.error); // Highlight
      }
    }
  }, [state, router, updateSessionFn, redirectAfterSuccess]);

  const resetForm = () => {
    setFirstName(initialFirstName);
    setLastName(initialLastName);
    setDisplayName(initialDisplayName);
    setBio(initialBio);
    setPhotoURL(initialPhotoURL);
    setPhotoFile(null);
    setIsSuccess(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const error = validateFileSize(file, 2);
    if (error) {
      toast.error(error);
      return;
    }

    const reader = new FileReader();
    reader.onload = e => setPhotoURL(e.target?.result as string);
    reader.readAsDataURL(file);
    setPhotoFile(file);
  };

  const handleCancel = () => {
    if (!isPending && !isUploading) {
      const formChanged =
        firstName !== initialFirstName ||
        lastName !== initialLastName ||
        displayName !== initialDisplayName ||
        bio !== initialBio ||
        (photoURL !== initialPhotoURL && photoURL !== null);

      if (formChanged && !window.confirm("You have unsaved changes. Are you sure you want to discard them?")) {
        return;
      }

      resetForm();
      toast.info("Changes discarded");

      if (onCancel) {
        onCancel();
      } else {
        router.push(isAdmin ? "/admin" : "/user");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("displayName", displayName);
      formData.append("bio", bio);

      if (photoFile) {
        setIsUploading(true);
        const imageUrl = await uploadFile(photoFile, { prefix: "profile" });
        formData.append("imageUrl", imageUrl);
      }
      console.log("[UserProfileForm] handleSubmit: Submitting formData with:", {
        // Highlight
        firstName,
        lastName,
        displayName,
        bio,
        photoFile: photoFile?.name
      });
      startTransition(() => {
        updateProcessedRef.current = false;
        formAction(formData);
      });
    } catch (error: unknown) {
      console.error("Profile update error:", error);
      const message =
        error instanceof Error && error.message.includes("File too large")
          ? "Image too large. Please upload a file under 2MB."
          : isFirebaseError(error)
            ? firebaseError(error)
            : error instanceof Error
              ? error.message
              : "Failed to update profile";

      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  if (status === "loading" || !formReady) {
    return <UserProfileSkeleton />;
  }

  return (
    <Card className="border-border/40 shadow-sm">
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Update your personal details and profile picture.</CardDescription>
      </CardHeader>
      <form id={id} onSubmit={handleSubmit} className="w-full">
        <CardContent className="grid gap-6">
          {state?.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-6 w-6" />
              <AlertDescription className="text-base">{state.error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-20 w-20 p-1 rounded-full ring-0 ring-offset-0 hover:ring-2 hover:ring-primary/50 focus:ring-2 focus:ring-primary/50 transition duration-200">
              <UserAvatar
                src={photoURL}
                name={session?.user?.name}
                email={session?.user?.email}
                className="h-full w-full"
              />
            </Button>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium">{isAdmin ? "Admin Profile" : "User Profile"}</h3>
                <Badge variant={isAdmin ? "destructive" : "secondary"}>{isAdmin ? "Admin" : "User"}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Upload a new profile picture</p>
              <div className="flex items-center gap-2">
                <Input
                  id="profile-image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isPending || isUploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("profile-image")?.click()}
                  disabled={isPending || isUploading}>
                  <Upload className="mr-2 h-4 w-4" /> Upload
                </Button>
              </div>
              {photoFile && <p className="text-sm text-muted-foreground">{photoFile.name}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UniversalInput
              id="firstName"
              label="First Name"
              value={firstName}
              onChange={setFirstName}
              required
              variant="compact"
              className="h-12 border-input dark:border-opacity-50 focus:ring-2 focus:ring-primary focus:border-primary"
            />
            <UniversalInput
              id="lastName"
              label="Last Name"
              value={lastName}
              onChange={setLastName}
              required
              variant="compact"
              className="h-12 border-input dark:border-opacity-50 focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <UniversalInput
            id="displayName"
            label="Display Name"
            value={displayName}
            onChange={setDisplayName}
            variant="compact"
            className="h-12 border-input dark:border-opacity-50 focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="e.g., MotoStix Fan"
          />

          <UniversalInput
            id="email"
            label="Email"
            value={session?.user?.email || ""}
            onChange={() => {}}
            variant="compact"
            className="h-12 bg-muted border border-gray-300 dark:border-gray-500 cursor-not-allowed opacity-50"
            disabled
          />

          <UniversalTextarea
            id="bio"
            label="Bio"
            value={bio}
            onChange={setBio}
            placeholder="Tell us a bit about yourself"
            variant="compact"
            className="resize-none min-h-[100px] border-input focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-start gap-4">
          <SubmitButton
            isLoading={isPending || isUploading}
            variant="default"
            loadingText={isUploading ? "Uploading..." : "Saving..."}
            className="h-12 px-6">
            Save changes
          </SubmitButton>

          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isPending || isUploading}
            className="h-12 px-6">
            Cancel
          </Button>

          {isSuccess && <p className="text-sm font-medium text-green-600">Profile updated successfully.</p>}
        </CardFooter>
      </form>
    </Card>
  );
}
