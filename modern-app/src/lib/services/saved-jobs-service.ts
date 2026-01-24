// src/lib/services/saved-jobs-service.ts
import { SavedJobsCollection } from "@/lib/firebase/admin";
import { config } from "@/lib/config/app-mode";

declare global {
  var mockSavedJobs: Map<string, Set<string>> | undefined;
}

function getMockStore() {
  globalThis.mockSavedJobs ??= new Map<string, Set<string>>();
  return globalThis.mockSavedJobs;
}

export async function getSavedJobIdsForUser(userId: string): Promise<string[]> {
  if (config.isMockMode) {
    const store = getMockStore();
    return store.has(userId) ? Array.from(store.get(userId)!) : [];
  }

  const savedJobIds = new Set<string>();
  const collection = SavedJobsCollection();

  const byUserSnapshot = await collection.where("userId", "==", userId).get();
  byUserSnapshot.docs.forEach(doc => {
    const data = doc.data() as { jobId?: string };
    if (data.jobId) savedJobIds.add(data.jobId);
  });

  // Fallback for legacy documents that still use tradespersonId
  if (savedJobIds.size === 0) {
    const legacySnapshot = await collection.where("tradespersonId", "==", userId).get();
    legacySnapshot.docs.forEach(doc => {
      const data = doc.data() as { jobId?: string };
      if (data.jobId) savedJobIds.add(data.jobId);
    });
  }

  return Array.from(savedJobIds);
}

export async function saveJobForUser(userId: string, jobId: string, role: string) {
  if (config.isMockMode) {
    const store = getMockStore();
    if (!store.has(userId)) store.set(userId, new Set());
    store.get(userId)!.add(jobId);
    return;
  }

  const docRef = SavedJobsCollection().doc(`${userId}_${jobId}`);
  const payload: Record<string, unknown> = {
    userId,
    jobId,
    role,
    savedAt: new Date()
  };

  if (role === "tradesperson") {
    payload.tradespersonId = userId;
  }

  await docRef.set(payload, { merge: true });
}

export async function removeSavedJobForUser(userId: string, jobId: string) {
  if (config.isMockMode) {
    const store = getMockStore();
    if (store.has(userId)) {
      store.get(userId)!.delete(jobId);
    }
    return;
  }

  await SavedJobsCollection().doc(`${userId}_${jobId}`).delete();
}
