"use client";

import type React from "react";
import { useState, useEffect, useRef, useActionState, useTransition } from "react";
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
import type { User } from "@/types/models/user";
import { UniversalInput } from "@/components/forms/UniversalInput";
import { UniversalTextarea } from "@/components/forms/UniversalTextarea";

// Standardized State Type from the refactored action
type ProfileState = Awaited<ReturnType<typeof updateUserProfile>> | null;

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

  // Input states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Logic states
  const [formReady, setFormReady] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isTransitionPending, startTransition] = useTransition();

  // Initial values for cancel logic
  const initialValues = useRef({
    firstName: "",
    lastName: "",
    displayName: "",
    bio: "",
    photoURL: null as string | null
  });
  const updateProcessedRef = useRef(false);

  // 1. Define the Bridge Action for useActionState
  const profileActionBridge = async (prevState: ProfileState, formData: FormData): Promise<ProfileState> => {
    // Extract values from FormData
    const data = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      displayName: formData.get("displayName") as string,
      bio: formData.get("bio") as string,
      image: (formData.get("imageUrl") as string) || undefined
    };

    // Call the refactored server action (which returns ServiceResult)
    return await updateUserProfile(data);
  };

  // 2. Initialize useActionState
  const [state, formAction, isPending] = useActionState(profileActionBridge, null);

  useEffect(() => {
    if (status === "authenticated" && session?.user && !formReady) {
      const u = session.user;
      const initialData = {
        firstName: u.firstName || "",
        lastName: u.lastName || "",
        displayName: u.displayName || u.name || "",
        bio: u.bio || "",
        photoURL: u.image || null
      };

      setFirstName(initialData.firstName);
      setLastName(initialData.lastName);
      setDisplayName(initialData.displayName);
      setBio(initialData.bio);
      setPhotoURL(initialData.photoURL);

      initialValues.current = initialData;
      setFormReady(true);
    }
  }, [session, status, formReady]);

  useEffect(() => {
    if (state && !updateProcessedRef.current) {
      if (state.ok) {
        updateProcessedRef.current = true;
        setIsSuccess(true);
        toast.success("Profile updated successfully");

        updateSessionFn()
          .then(() => {
            if (redirectAfterSuccess) {
              setTimeout(() => router.push(redirectAfterSuccess), 1500);
            }
          })
          .catch(err => toast.error("Profile saved, but session refresh failed."));
      } else {
        toast.error(state.error || "Failed to update profile");
      }
    }
  }, [state, router, updateSessionFn, redirectAfterSuccess]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const error = validateFileSize(file, 2);
    if (error) return toast.error(error);

    const reader = new FileReader();
    reader.onload = e => setPhotoURL(e.target?.result as string);
    reader.readAsDataURL(file);
    setPhotoFile(file);
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

      startTransition(() => {
        updateProcessedRef.current = false;
        formAction(formData);
      });
    } catch (error: unknown) {
      toast.error(isFirebaseError(error) ? firebaseError(error) : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  if (status === "loading" || !formReady) return <UserProfileSkeleton />;

  return (
    <Card className="border-border/40 shadow-sm">
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Update your personal details and profile picture.</CardDescription>
      </CardHeader>

      <form id={id} onSubmit={handleSubmit} className="w-full">
        <CardContent className="grid gap-6">
          {state && !state.ok && (
            <Alert variant="destructive">
              <AlertCircle className="h-6 w-6" />
              <AlertDescription className="text-base">{state.error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <UserAvatar src={photoURL} name={session?.user?.name} email={session?.user?.email} className="h-20 w-20" />

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium">{isAdmin ? "Admin Profile" : "User Profile"}</h3>
                <Badge variant={isAdmin ? "destructive" : "secondary"}>{isAdmin ? "Admin" : "User"}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Upload a new profile picture</p>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UniversalInput
              id="firstName"
              label="First Name"
              value={firstName}
              onChange={setFirstName}
              required
              variant="compact"
            />
            <UniversalInput
              id="lastName"
              label="Last Name"
              value={lastName}
              onChange={setLastName}
              required
              variant="compact"
            />
          </div>

          <UniversalInput
            id="displayName"
            label="Display Name"
            value={displayName}
            onChange={setDisplayName}
            variant="compact"
            placeholder="e.g., MotoStix Fan"
          />

          <UniversalInput
            id="email"
            label="Email"
            value={session?.user?.email || ""}
            onChange={() => {}}
            variant="compact"
            className="bg-muted opacity-50 cursor-not-allowed"
            disabled
          />

          <UniversalTextarea
            id="bio"
            label="Bio"
            value={bio}
            onChange={setBio}
            placeholder="Tell us a bit about yourself"
            variant="compact"
            className="resize-none min-h-[100px]"
          />
        </CardContent>

        <CardFooter className="flex flex-wrap items-center justify-start gap-4">
          <SubmitButton
            isLoading={isPending || isTransitionPending || isUploading}
            loadingText={isUploading ? "Uploading..." : "Saving..."}
            className="h-12 px-6">
            Save changes
          </SubmitButton>

          <Button
            type="button"
            variant="outline"
            onClick={onCancel || (() => router.back())}
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
