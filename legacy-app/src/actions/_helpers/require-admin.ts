// src/actions/_helpers/require-admin.ts
"use server";

export type RequireAdminResult = { success: true; userId: string } | { success: false; error: string; status?: number };

export async function requireAdmin(): Promise<RequireAdminResult> {
  const { auth } = await import("@/auth");
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated", status: 401 };
  }

  // ✅ simplest + cheapest admin gate (no Firestore call, avoids getUserRole crashes)
  if (session.user.role !== "admin") {
    return { success: false, error: "Unauthorized. Admin access required.", status: 403 };
  }

  return { success: true, userId: session.user.id };
}
