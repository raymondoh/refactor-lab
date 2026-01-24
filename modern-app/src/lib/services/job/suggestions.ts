// // src/lib/services/job/suggestions.ts
// import { JobsCollection } from "@/lib/firebase/admin";
// import type { Job } from "@/lib/types/job";
// import { logger } from "@/lib/logger";

// export type SuggestionJob = Pick<Job, "title" | "serviceType" | "location">;

// export async function getJobsForSuggestions(limit: number): Promise<SuggestionJob[]> {
//   try {
//     const snapshot = await JobsCollection()
//       .where("status", "==", "open")
//       .where("deletedAt", "==", null)
//       .select("title", "serviceType", "location")
//       .limit(limit)
//       .get();

//     const suggestions: SuggestionJob[] = snapshot.docs.map(doc => {
//       const data = doc.data() as Record<string, any>;

//       return {
//         title: data.title ?? "",
//         serviceType: data.serviceType,
//         location: {
//           postcode: data.location?.postcode ?? "",
//           // Keep these optional in case they exist in Firestore
//           town: data.location?.town,
//           address: data.location?.address,
//           latitude: data.location?.latitude,
//           longitude: data.location?.longitude
//         }
//       };
//     });

//     return suggestions;
//   } catch (error) {
//     logger.error("Error fetching job suggestions:", error);
//     throw new Error("Failed to fetch job suggestions");
//   }
// }
// src/lib/services/job/suggestions.ts
import { JobsCollection } from "@/lib/firebase/admin";
import type { Job } from "@/lib/types/job";
import { logger } from "@/lib/logger";

export type SuggestionJob = Pick<Job, "title" | "serviceType" | "location">;

export async function getJobsForSuggestions(limit: number): Promise<SuggestionJob[]> {
  try {
    const snapshot = await JobsCollection()
      .where("status", "==", "open")
      .where("deletedAt", "==", null)
      .select("title", "serviceType", "location")
      .limit(limit)
      .get();

    const suggestions: SuggestionJob[] = snapshot.docs
      .map(doc => {
        const raw = doc.data() as Partial<SuggestionJob> | undefined;

        if (!raw || !raw.serviceType || !raw.location?.postcode) {
          // Skip if we don’t have a valid serviceType or postcode
          return null;
        }

        const suggestion: SuggestionJob = {
          title: raw.title ?? "",
          serviceType: raw.serviceType,
          location: {
            postcode: raw.location.postcode ?? "",
            // keep these as-is; underlying Job type will handle optionality
            town: raw.location.town,
            address: raw.location.address,
            latitude: raw.location.latitude,
            longitude: raw.location.longitude
          }
        };

        return suggestion;
      })
      .filter((job): job is SuggestionJob => job !== null);

    return suggestions;
  } catch (error) {
    logger.error("Error fetching job suggestions:", error);
    throw new Error("Failed to fetch job suggestions");
  }
}
