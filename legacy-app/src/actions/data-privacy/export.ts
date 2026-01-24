"use server";

import { getAdminFirestore, getAdminStorage } from "@/lib/firebase/admin/initialize";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { logActivity } from "@/firebase/log/logActivity";

// Export user data
export async function exportUserData(prevState: any, formData: FormData) {
  try {
    // Dynamic import to avoid build-time initialization
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const userId = session.user.id;
    const format = (formData.get("format") as string) || "json";
    const db = getAdminFirestore();

    // Get user profile
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      return { success: false, error: "User data not found" };
    }

    // Get user orders
    const ordersSnapshot = await db.collection("orders").where("userId", "==", userId).get();
    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get user likes
    const likesSnapshot = await db.collection("users").doc(userId).collection("likes").get();
    const likes = likesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get user activity
    const activitySnapshot = await db.collection("activity").where("userId", "==", userId).get();
    const activity = activitySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Compile all data
    const exportData = {
      profile: {
        ...userData,
        id: userId
      },
      orders,
      likes,
      activity
    };

    // Generate file content
    let fileContent: string;
    let contentType: string;
    let fileExtension: string;

    if (format === "json") {
      fileContent = JSON.stringify(exportData, null, 2);
      contentType = "application/json";
      fileExtension = "json";
    } else {
      // Simple CSV conversion for profile data
      const csvData = Object.entries(exportData.profile)
        .map(([key, value]) => `${key},${JSON.stringify(value)}`)
        .join("\n");
      fileContent = `key,value\n${csvData}`;
      contentType = "text/csv";
      fileExtension = "csv";
    }

    // Store file in Firebase Storage
    const storage = getAdminStorage();
    const fileName = `data-exports/${userId}/user-data-${Date.now()}.${fileExtension}`;
    const file = storage.bucket().file(fileName);

    await file.save(fileContent, {
      metadata: { contentType }
    });

    // Get signed URL for download
    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 60 * 60 * 1000 // 1 hour
    });

    await logActivity({
      userId,
      type: "data-export",
      description: "User data exported",
      status: "success"
    });

    return {
      success: true,
      downloadUrl: signedUrl,
      message: `Your data has been exported in ${format.toUpperCase()} format`
    };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Unknown error exporting user data";
    console.error("Error exporting user data:", message);
    return { success: false, error: message };
  }
}
