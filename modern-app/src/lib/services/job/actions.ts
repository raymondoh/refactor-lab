"use server";

// src/lib/services/job/actions.ts
// This file now contains the core CRUD operations for jobs.
import type { Job, JobStatus, CreateJobData, UpdateJobData, JobLocation, PaymentRecord } from "@/lib/types/job";

import { JobsCollection } from "@/lib/firebase/admin";
import { geocodingService } from "../geocoding-service";
import {
  FieldPath,
  type DocumentData,
  type DocumentSnapshot,
  type QueryDocumentSnapshot
} from "firebase-admin/firestore";
import { findMatchingTradespeople } from "@/lib/services/user/actions";
import { notificationService } from "@/lib/services/notification-service";
import { emailService } from "@/lib/email/email-service";
import { logger } from "@/lib/logger";
import { toSlug } from "@/lib/utils/slugify";

import type { JobServiceType } from "@/lib/config/locations";

const toDateOrNull = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    const converted = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(converted.getTime()) ? null : converted;
  }
  if (typeof value === "number" || typeof value === "string") {
    const converted = new Date(value);
    return Number.isNaN(converted.getTime()) ? null : converted;
  }
  return null;
};

// Create a set of lowercase tokens used for keyword searching
function generateJobKeywords(data: {
  title?: string;
  description?: string;
  serviceType?: JobServiceType;
  location?: JobLocation;
  skills?: string[];
}): string[] {
  const keywords = new Set<string>();
  const addWords = (text?: string) => {
    if (!text) return;
    text
      .toLowerCase()
      .split(/\s+/)
      .forEach(word => keywords.add(word));
  };

  addWords(data.title);
  addWords(data.description);
  addWords(data.serviceType);
  addWords(data.location?.postcode);
  addWords(data.location?.address);
  data.skills?.forEach(addWords);

  return Array.from(keywords).filter(Boolean);
}

function mapPaymentRecord(record: unknown): PaymentRecord | null {
  if (!record || typeof record !== "object") return null;

  const type = (record as { type?: unknown }).type;
  const normalizedType = type === "deposit" || type === "final" ? (type as PaymentRecord["type"]) : null;
  if (!normalizedType) return null;

  const intentId = (record as { paymentIntentId?: unknown }).paymentIntentId;
  if (typeof intentId !== "string" || intentId.length === 0) return null;

  const amountValue = (record as { amount?: unknown }).amount;
  const amount = typeof amountValue === "number" ? amountValue : 0;

  const rawPaidAt = (record as { paidAt?: unknown }).paidAt;
  let paidAt: Date | null = null;
  if (rawPaidAt instanceof Date) {
    paidAt = rawPaidAt;
  } else if (rawPaidAt && typeof (rawPaidAt as { toDate?: () => Date }).toDate === "function") {
    paidAt = (rawPaidAt as { toDate: () => Date }).toDate();
  } else if (typeof rawPaidAt === "number" || typeof rawPaidAt === "string") {
    const parsed = new Date(rawPaidAt);
    if (!Number.isNaN(parsed.getTime())) {
      paidAt = parsed;
    }
  }

  if (!paidAt) return null;

  const stripeReceiptUrlValue = (record as { stripeReceiptUrl?: unknown }).stripeReceiptUrl;
  const stripeReceiptUrl = typeof stripeReceiptUrlValue === "string" ? stripeReceiptUrlValue : null;

  return {
    type: normalizedType,
    paymentIntentId: intentId,
    amount,
    paidAt,
    stripeReceiptUrl
  } satisfies PaymentRecord;
}

function extractPayments(raw: unknown): PaymentRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(entry => mapPaymentRecord(entry)).filter((entry): entry is PaymentRecord => Boolean(entry));
}

function slugifyOrUndefined(value?: string | null): string | undefined {
  if (!value) return undefined;
  const slug = toSlug(value);
  return slug.length > 0 ? slug : undefined;
}

function deriveCitySlug({
  explicit,
  location,
  geocode
}: {
  explicit?: string | null;
  location?: JobLocation | null;
  geocode?: { district?: string | null; ward?: string | null };
}): string | undefined {
  return (
    slugifyOrUndefined(explicit) ??
    slugifyOrUndefined(location?.town) ??
    slugifyOrUndefined(geocode?.district) ??
    slugifyOrUndefined(geocode?.ward)
  );
}

// Updated signature to accept any DocumentSnapshot or QueryDocumentSnapshot
const mapJob = (doc: DocumentSnapshot<any> | QueryDocumentSnapshot<any>): Job | null => {
  const data = doc.data() as DocumentData | undefined;
  if (!data) return null;

  const deletedAt = toDateOrNull((data as { deletedAt?: unknown }).deletedAt);
  const createdAt = toDateOrNull(data.createdAt) ?? new Date();
  const updatedAt = toDateOrNull(data.updatedAt) ?? new Date();

  const scheduledDate = toDateOrNull(data.scheduledDate) || undefined;
  const completedDate = toDateOrNull(data.completedDate) || undefined;

  const payments = extractPayments(data.payments);

  return {
    ...data,
    id: doc.id,
    createdAt,
    updatedAt,
    scheduledDate: scheduledDate ?? undefined,
    completedDate: completedDate ?? undefined,
    tradespersonId: data.tradespersonId,
    payments,
    deletedAt,
    deletedBy: (data as { deletedBy?: string | null }).deletedBy ?? null,
    deletionReason: (data as { deletionReason?: string | null }).deletionReason ?? null
  } as Job;
};

export async function createJob(data: CreateJobData): Promise<Job> {
  try {
    const jobsCollection = JobsCollection();

    let locationData: JobLocation = typeof data.location === "string" ? { postcode: data.location } : data.location;

    const geoResult = await geocodingService.getCoordinatesFromPostcode(locationData.postcode);

    if (geoResult) {
      locationData = {
        ...locationData,
        latitude: geoResult.coordinates.latitude,
        longitude: geoResult.coordinates.longitude
      };
    }

    const citySlug = deriveCitySlug({
      explicit: data.citySlug ?? null,
      location: locationData,
      geocode: geoResult ?? undefined
    });

    const jobData: Omit<Job, "id"> & { searchKeywords: string[] } = {
      ...(data as Omit<Job, "id">),
      location: locationData,
      citySlug,
      status: "open",
      createdAt: new Date(),
      updatedAt: new Date(),
      quoteCount: 0,
      isFromOnboarding: data.isFromOnboarding ?? false,
      deletedAt: null,
      deletedBy: null,
      deletionReason: null,
      searchKeywords: generateJobKeywords({
        title: data.title,
        description: data.description,
        serviceType: data.serviceType,
        location: locationData,
        // skills is optional on data, so we pull it defensively
        skills: (data as unknown as { skills?: string[] }).skills
      })
    };

    const removeUndefined = (obj: Record<string, unknown>): void => {
      Object.keys(obj).forEach(key => {
        const value = obj[key as keyof typeof obj];
        if (value === undefined) {
          delete obj[key as keyof typeof obj];
        } else if (typeof value === "object" && value !== null) {
          removeUndefined(value as Record<string, unknown>);
        }
      });
    };
    removeUndefined(jobData as unknown as Record<string, unknown>);

    const docRef = await jobsCollection.add(jobData);
    const newJob = { ...jobData, id: docRef.id } as Job;

    // ─────────────────────────────────────────────
    //  Job alerts (in-app + email)
    // ─────────────────────────────────────────────
    // ─────────────────────────────────────────────
    //  Job alerts (in-app + email)
    // ─────────────────────────────────────────────
    try {
      logger.info(`[Job Alerts] Finding matches for new job (ID: ${newJob.id}, Title: "${newJob.title}")`);

      // New API: grouped by tier
      const { businessTier, proTier, basicTier } = await findMatchingTradespeople(newJob);

      const allMatches = [...businessTier, ...proTier, ...basicTier];
      const proBusinessMatches = [...businessTier, ...proTier];
      const basicMatches = [...basicTier];

      logger.info("[new-job-alert] matching summary", {
        jobId: newJob.id,
        jobServiceType: newJob.serviceType,
        jobPostcode: newJob.location?.postcode,
        jobTown: newJob.location?.town,
        totalMatches: allMatches.length,
        proBusinessCount: proBusinessMatches.length,
        basicCount: basicMatches.length
      });

      if (allMatches.length === 0) {
        logger.warn("[new-job-alert] No tradespeople matched this job; no alerts sent", {
          jobId: newJob.id
        });
      } else {
        // Everyone who matched gets an in-app notification
        const notificationRecipients = allMatches;

        for (const tradesperson of notificationRecipients) {
          await notificationService.createNotification(
            tradesperson.id,
            "new_job_alert",
            `A new job matching your skills has been posted: "${newJob.title}"`,
            { jobId: newJob.id }
          );
        }

        // 👇 CHANGE IS HERE: now send emails to *all* matches (Basic + Pro + Business)
        const emailRecipients = allMatches;

        let emailsSent = 0;
        const emailRecipientMeta: { id: string; email: string }[] = [];

        for (const tradesperson of emailRecipients) {
          if (!tradesperson.email) continue;

          const recipientName = tradesperson.firstName ?? tradesperson.name;
          await emailService.sendNewJobAlertEmail(tradesperson.email, newJob, recipientName);
          emailsSent += 1;
          emailRecipientMeta.push({ id: tradesperson.id, email: tradesperson.email });

          logger.info(`📧 Email ("New job available: ${newJob.title}") sent successfully`, {
            to: tradesperson.email
          });
        }

        logger.info("[Job Alerts] Emails sent", {
          jobId: newJob.id,
          jobTitle: newJob.title,
          recipientCount: emailRecipients.length,
          emailsSent,
          recipients: emailRecipientMeta
        });
      }
    } catch (error) {
      logger.error("Failed to send job alerts:", error);
    }

    return newJob;
  } catch (error: unknown) {
    logger.error("Error creating job:", error);
    throw new Error("Failed to create job");
  }
}

export async function getJobById(id: string): Promise<Job | null> {
  try {
    const doc = await JobsCollection().doc(id).get();
    if (!doc.exists) return null;

    const job = mapJob(doc);
    if (!job || job.deletedAt) return null;

    return job;
  } catch (error) {
    logger.error("Error getting job:", error);
    throw new Error("Failed to get job");
  }
}

export async function getJobsByCustomer(customerId: string): Promise<Job[]> {
  try {
    const snapshot = await JobsCollection().where("customerId", "==", customerId).orderBy("createdAt", "desc").get();

    const jobs = snapshot.docs.map(doc => mapJob(doc)).filter((job): job is Job => Boolean(job && !job.deletedAt));

    return jobs;
  } catch (error) {
    logger.error("Error getting jobs by customer:", error);
    throw new Error("Failed to get jobs");
  }
}

export async function getPaginatedJobs({
  limit = 6,
  lastVisibleId = null
}: {
  limit?: number;
  lastVisibleId?: string | null;
}): Promise<{
  jobs: Job[];
  lastVisibleId: string | null;
  totalJobCount: number;
}> {
  try {
    const jobsCollection = JobsCollection();
    let query = jobsCollection.where("deletedAt", "==", null).orderBy(FieldPath.documentId()).limit(limit);
    if (lastVisibleId) {
      const lastVisibleDoc = await jobsCollection.doc(lastVisibleId).get();
      if (lastVisibleDoc.exists) {
        query = query.startAfter(lastVisibleDoc);
      }
    }

    const [snapshot, countSnap] = await Promise.all([
      query.get(),
      jobsCollection.where("deletedAt", "==", null).count().get()
    ]);

    const jobs = snapshot.docs.map(doc => mapJob(doc)).filter((job): job is Job => Boolean(job && !job.deletedAt));

    const nextCursor = snapshot.size === limit ? snapshot.docs[snapshot.docs.length - 1].id : null;

    return {
      jobs,
      lastVisibleId: nextCursor,
      totalJobCount: countSnap.data().count
    };
  } catch (error) {
    logger.error("JobService: getPaginatedJobs error:", error);
    throw new Error("Failed to fetch paginated jobs");
  }
}

export async function getAllJobs(): Promise<Job[]> {
  try {
    const snapshot = await JobsCollection().where("deletedAt", "==", null).orderBy("createdAt", "desc").get();
    if (snapshot.empty) return [];
    const jobs = snapshot.docs.map(doc => mapJob(doc)).filter((job): job is Job => Boolean(job && !job.deletedAt));

    return jobs;
  } catch (error) {
    logger.error("Error getting all jobs:", error);
    throw new Error("Failed to get all jobs");
  }
}

export async function getTotalJobCount(): Promise<number> {
  try {
    const jobsCollection = JobsCollection();
    const countSnap = await jobsCollection.where("deletedAt", "==", null).count().get();
    return countSnap.data().count;
  } catch (error) {
    logger.error("JobService: getTotalJobCount error:", error);
    throw new Error("Failed to get total job count");
  }
}

export async function getJobCountByStatus(status: JobStatus): Promise<number> {
  try {
    const jobsCollection = JobsCollection();
    const countSnap = await jobsCollection.where("status", "==", status).where("deletedAt", "==", null).count().get();
    return countSnap.data().count;
  } catch (error) {
    logger.error("JobService: getJobCountByStatus error:", error);
    throw new Error("Failed to get job count by status");
  }
}

export async function getOpenJobs(): Promise<Job[]> {
  try {
    logger.info("[LOG] Attempting to fetch open jobs...");
    // Removed Firestore orderBy to avoid missing index issues
    const snapshot = await JobsCollection().where("status", "==", "open").where("deletedAt", "==", null).get();

    const jobs = snapshot.docs.map(doc => mapJob(doc)).filter((job): job is Job => Boolean(job && !job.deletedAt));

    // Sort jobs by createdAt in memory to preserve expected order
    jobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    logger.info(`[LOG] Firestore query for open jobs returned ${jobs.length} documents.`);
    return jobs;
  } catch (error) {
    logger.error("Error getting open jobs:", error);
    throw new Error("Failed to get open jobs");
  }
}

export async function getRecentOpenJobs(limit: number): Promise<Job[]> {
  try {
    const snapshot = await JobsCollection()
      .where("status", "==", "open")
      .where("deletedAt", "==", null)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const jobs = snapshot.docs.map(doc => mapJob(doc)).filter((job): job is Job => Boolean(job && !job.deletedAt));

    return jobs;
  } catch (error) {
    logger.error("Error getting recent open jobs:", error);

    // 🔥 graceful fallback instead of throw
    return [];
  }
}

export async function updateJob(id: string, data: UpdateJobData): Promise<Job> {
  try {
    const updateData: Partial<UpdateJobData> & { updatedAt: Date } = {
      ...data,
      updatedAt: new Date()
    };

    if (data.location) {
      let locationData = data.location;
      let citySlug = deriveCitySlug({ explicit: data.citySlug ?? null, location: locationData });
      let geoResult: Awaited<ReturnType<typeof geocodingService.getCoordinatesFromPostcode>> | null = null;

      const needsCoordinates = locationData.latitude == null || locationData.longitude == null;

      if ((!citySlug || needsCoordinates) && locationData.postcode.trim().length > 0) {
        geoResult = await geocodingService.getCoordinatesFromPostcode(locationData.postcode);
      }

      if (geoResult) {
        locationData = {
          ...locationData,
          latitude: locationData.latitude ?? geoResult.coordinates.latitude,
          longitude: locationData.longitude ?? geoResult.coordinates.longitude
        };

        if (!citySlug) {
          citySlug = deriveCitySlug({
            explicit: data.citySlug ?? null,
            location: locationData,
            geocode: geoResult ?? undefined
          });
        }
      }

      updateData.location = locationData;
      if (citySlug) {
        updateData.citySlug = citySlug;
      }
    } else if (data.citySlug) {
      const citySlug = slugifyOrUndefined(data.citySlug);
      if (citySlug) {
        updateData.citySlug = citySlug;
      }
    }

    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });

    await JobsCollection().doc(id).update(updateData);
    const updated = await getJobById(id);
    if (!updated) throw new Error("Job not found");
    return updated;
  } catch (error) {
    logger.error("Error updating job:", error);
    throw new Error("Failed to update job");
  }
}

export async function updateJobStatus(id: string, status: JobStatus): Promise<void> {
  try {
    await JobsCollection().doc(id).update({
      status,
      updatedAt: new Date()
    });
  } catch (error) {
    logger.error("Error updating job status:", error);
    throw new Error("Failed to update job status");
  }
}

export async function deleteJob(id: string): Promise<void> {
  try {
    await JobsCollection().doc(id).delete();
  } catch (error) {
    logger.error("Error deleting job:", error);
    throw new Error("Failed to delete job");
  }
}
