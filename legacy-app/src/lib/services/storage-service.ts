// src/lib/services/storage-service.ts

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
    const fileExtension = file.name.split(".").pop() || "png";
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

export type DeleteResult =
  | { success: true; deleted: number; skipped: number }
  | { success: false; error: string; status: number };

/** Accepts either a storage path (e.g. "products/product-123.png")
 *  or a public URL (e.g. "https://storage.googleapis.com/<bucket>/products/product-123.png").
 *  Returns a storage path, or null if it can't parse.
 */
function toStoragePath(input: string): string | null {
  const value = input.trim();
  if (!value) return null;

  // If already a path like "products/xyz.png"
  if (!value.startsWith("http://") && !value.startsWith("https://")) {
    return value.startsWith("/") ? value.slice(1) : value;
  }

  try {
    const url = new URL(value);

    // Most common: https://storage.googleapis.com/<bucket>/<path>
    if (url.hostname === "storage.googleapis.com") {
      const parts = url.pathname.split("/").filter(Boolean);
      // pathname: /<bucket>/<path...>
      if (parts.length >= 2) return parts.slice(1).join("/");
      return null;
    }

    // Also common: https://<bucket>.storage.googleapis.com/<path>
    if (url.hostname.endsWith(".storage.googleapis.com")) {
      const path = url.pathname.split("/").filter(Boolean).join("/");
      return path || null;
    }

    // Firebase download URLs:
    // https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<encodedPath>?alt=media
    if (url.hostname === "firebasestorage.googleapis.com") {
      const match = url.pathname.match(/\/v0\/b\/[^/]+\/o\/(.+)/);
      if (!match?.[1]) return null;
      const encoded = match[1].split("?")[0] ?? "";
      const decoded = decodeURIComponent(encoded);
      return decoded || null;
    }

    return null;
  } catch {
    return null;
  }
}

/** Delete a single object by path or URL. Uses ignoreNotFound. */
export async function deleteStorageObject(input: string): Promise<DeleteResult> {
  try {
    const path = toStoragePath(input);
    if (!path) {
      return { success: false, error: "Invalid storage path/url.", status: 400 };
    }

    const bucket = getAdminStorage().bucket();
    await bucket.file(path).delete({ ignoreNotFound: true });

    return { success: true, deleted: 1, skipped: 0 };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error occurred during file deletion";

    console.error("Storage service delete error:", message);

    return { success: false, error: `Delete failed: ${message}`, status: 500 };
  }
}

/** Bulk delete. Accepts a mix of paths and URLs. Skips anything un-parseable. */
export async function deleteStorageObjects(inputs: string[]): Promise<DeleteResult> {
  try {
    const bucket = getAdminStorage().bucket();

    const paths = inputs.map(toStoragePath).filter((p): p is string => typeof p === "string" && p.length > 0);

    if (paths.length === 0) {
      return { success: true, deleted: 0, skipped: inputs.length };
    }

    const uniquePaths = Array.from(new Set(paths));

    await Promise.all(uniquePaths.map(p => bucket.file(p).delete({ ignoreNotFound: true })));

    return { success: true, deleted: uniquePaths.length, skipped: inputs.length - paths.length };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
        ? error.message
        : "Unknown error occurred during bulk deletion";

    console.error("Storage service bulk delete error:", message);

    return { success: false, error: `Delete failed: ${message}`, status: 500 };
  }
}

/** Convenience alias for clarity at call-sites. */
export async function deleteProductImages(imageRefs: string[]): Promise<DeleteResult> {
  return deleteStorageObjects(imageRefs);
}
