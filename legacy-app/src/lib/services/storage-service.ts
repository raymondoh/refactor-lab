"use server";

import { getAdminStorage } from "@/lib/firebase/admin/initialize";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";

export interface UploadFileOptions {
  file: File;
  userId: string;
  userRole: string;
}

// Fix: Use type instead of interface for union types
export type UploadResult = { success: true; url: string } | { success: false; error: string; status: number };

export async function uploadFile({ file, userId, userRole }: UploadFileOptions): Promise<UploadResult> {
  try {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      return {
        success: false,
        error: "File must be an image",
        status: 400
      };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const bucket = getAdminStorage().bucket();
    const fileExtension = file.name.split(".").pop();
    const isAdmin = userRole === "admin";
    const isProfileImage = file.name.startsWith("profile-");

    let filePath = "";

    if (isProfileImage) {
      // All users can upload profile images
      filePath = `users/${userId}/profile-${Date.now()}.${fileExtension}`;
    } else if (isAdmin) {
      // Only admins can upload product images
      filePath = `products/product-${Date.now()}.${fileExtension}`;
    } else {
      return {
        success: false,
        error: "Unauthorized to upload this image",
        status: 403
      };
    }

    const fileRef = bucket.file(filePath);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type
      }
    });

    await fileRef.makePublic();

    const url = `https://storage.googleapis.com/${bucket.name}/${fileRef.name}`;

    return {
      success: true,
      url
    };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Unknown error occurred during file upload";

    console.error("Storage service upload error:", message);

    return {
      success: false,
      error: `Upload failed: ${message}`,
      status: 500
    };
  }
}
