// src/lib/services/storage-service.ts
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { ensureFirebaseAuth, getFirebaseStorage, getFirebaseAuth } from "@/lib/firebase/client";
import { getStorage as getAdminStorage } from "firebase-admin/storage";
import { getEnv } from "@/lib/env";
import { config } from "@/lib/config/app-mode";
import { logger } from "@/lib/logger";

const env = getEnv();

export interface UploadProgress {
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
}

export class StorageService {
  private static instance: StorageService;

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  private async ensureAuthenticated(): Promise<string> {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error("Firebase auth not initialized");
    }
    const user = auth.currentUser ?? (await ensureFirebaseAuth());

    if (!user) {
      throw new Error("User must be authenticated to upload files");
    }

    return user.uid;
  }

  /**
   * [CLIENT-SIDE] Upload a file to Firebase Storage.
   */
  async uploadFile(
    file: File,
    pathOrOptions: string | { body: string; certificationId: string },
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    try {
      let path: string;
      if (typeof pathOrOptions === "string") {
        await this.ensureAuthenticated();
        path = pathOrOptions;
      } else {
        const userId = await this.ensureAuthenticated();
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        path = `certifications/${pathOrOptions.body}/${userId}/${pathOrOptions.certificationId}/${Date.now()}-${sanitizedFileName}`;
      }

      const storage = getFirebaseStorage();
      if (!storage) {
        throw new Error("Firebase storage not initialized");
      }
      const storageRef = ref(storage, path);

      if (onProgress) {
        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            snapshot => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              onProgress({
                progress,
                bytesTransferred: snapshot.bytesTransferred,
                totalBytes: snapshot.totalBytes
              });
            },
            error => {
              logger.error("StorageService: Upload error:", error);
              reject(new Error(`Upload failed: ${error.message}`));
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadURL);
              } catch (error) {
                reject(error);
              }
            }
          );
        });
      } else {
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
      }
    } catch (error) {
      logger.error("StorageService: uploadFile error:", error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * [SERVER-SIDE] Upload a file using the Firebase Admin SDK.
   */
  async uploadFileAsAdmin(file: File, path: string): Promise<string> {
    const bucket = getAdminStorage().bucket(env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const fileUpload = bucket.file(path);

    await fileUpload.save(fileBuffer, {
      metadata: {
        contentType: file.type
      }
    });

    // Make the file public to get a downloadable URL
    await fileUpload.makePublic();
    return fileUpload.publicUrl();
  }

  /**
   * Upload multiple files to Firebase Storage
   */
  async uploadMultipleFiles(
    files: File[],
    basePath: string,
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<string[]> {
    try {
      await this.ensureAuthenticated();

      const uploadPromises = files.map((file, index) => {
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${basePath}/${fileName}`;

        return this.uploadFile(file, filePath, onProgress ? progress => onProgress(index, progress) : undefined);
      });

      return await Promise.all(uploadPromises);
    } catch (error) {
      logger.error("StorageService: uploadMultipleFiles error:", error);
      throw new Error(`Failed to upload files: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Delete a file from Firebase Storage
   */
  async deleteFile(downloadURL: string): Promise<void> {
    try {
      await this.ensureAuthenticated();

      const storage = getFirebaseStorage();
      if (!storage) {
        throw new Error("Firebase storage not initialized");
      }
      const storageRef = ref(storage, downloadURL);
      await deleteObject(storageRef);
    } catch (error) {
      const err = error as { code?: string } | Error;
      // Ignore missing files so broken links can be removed cleanly
      if (typeof err === "object" && err && "code" in err && err.code === "storage/object-not-found") {
        logger.warn("StorageService: deleteFile object not found:", downloadURL);
        return;
      }
      logger.error("StorageService: deleteFile error:", error);
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Generate a storage path for user files
   */
  async generateUserFilePath(category: "portfolio" | "profile" | "documents", fileName: string): Promise<string> {
    const userId = await this.ensureAuthenticated();
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    return `users/${userId}/${category}/${timestamp}-${sanitizedFileName}`;
  }

  /**
   * Validate file before upload
   */
  validateFile(
    file: File,
    options: {
      maxSize?: number; // in bytes
      allowedTypes?: string[];
    } = {}
  ): { isValid: boolean; error?: string } {
    // UPDATED: Added 'application/pdf' to the allowed types
    const { maxSize = 10 * 1024 * 1024, allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"] } =
      options;

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type must be one of: ${allowedTypes.join(", ")}`
      };
    }

    return { isValid: true };
  }

  /**
   * Delete all files in a folder using the Firebase Admin SDK.
   */
  async deleteFolder(prefix: string): Promise<void> {
    if (config.isMockMode) {
      return;
    }

    try {
      const bucketName =
        env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
        "plumbers-portal.firebasestorage.app";
      const bucket = getAdminStorage().bucket(bucketName);
      const normalizedPrefix = prefix.endsWith("/") ? prefix : `${prefix}/`;

      const [files] = await bucket.getFiles({ prefix: normalizedPrefix });

      if (!files.length) {
        return;
      }

      await Promise.all(
        files.map(async file => {
          try {
            await file.delete();
          } catch (error) {
            const err = error as { code?: number };
            if (typeof err?.code === "number" && err.code === 404) {
              return;
            }
            throw error;
          }
        })
      );
    } catch (error) {
      logger.error("StorageService: deleteFolder error:", error);
      throw new Error(`Failed to delete storage folder: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}

export const storageService = StorageService.getInstance();
