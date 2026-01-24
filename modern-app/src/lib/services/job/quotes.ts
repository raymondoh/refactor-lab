// src/lib/services/job/quotes.ts
import type { Quote, CreateQuoteData, QuoteLineItem } from "@/lib/types/quote";
import { JobsCollection, getAdminCollection, COLLECTIONS, getFirebaseAdminDb } from "@/lib/firebase/admin";
import { FieldValue, Timestamp, type DocumentData, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { notificationService } from "@/lib/services/notification-service";
import { emailService } from "@/lib/email/email-service";
import { userService } from "@/lib/services/user-service";
import { customerService } from "@/lib/services/customer-service";
import type { Job } from "@/lib/types/job";
import type { User, UpdateUserData } from "@/lib/types/user";
import { logger } from "@/lib/logger";

type BusinessCandidate = User & { subscriptionTier?: "basic" | "pro" | "business" };

type CustomerContactInfo = {
  name: string;
  email?: string;
  phone?: string;
};

function normaliseContact(contact: Job["customerContact"]): CustomerContactInfo {
  return {
    name: contact?.name?.trim() || "Customer",
    email: contact?.email?.trim() || undefined,
    phone: contact?.phone?.trim() || undefined
  };
}

async function ensureBusinessCustomer(ownerId: string, contact: CustomerContactInfo) {
  const existing = await customerService.findCustomerByContact(ownerId, {
    email: contact.email,
    phone: contact.phone
  });

  if (existing) {
    if ((!existing.email && contact.email) || (!existing.phone && contact.phone)) {
      return customerService.updateCustomer(ownerId, existing.id, {
        email: existing.email ?? contact.email,
        phone: existing.phone ?? contact.phone
      });
    }
    return existing;
  }

  return customerService.createCustomer(ownerId, {
    name: contact.name,
    email: contact.email,
    phone: contact.phone
  });
}

function getTotalJobPayments(jobData: Job): number | undefined {
  if (!Array.isArray(jobData.payments) || jobData.payments.length === 0) return undefined;
  const total = jobData.payments.reduce((sum, payment) => {
    const amount = typeof payment?.amount === "number" ? payment.amount : 0;
    return sum + amount;
  }, 0);

  return total > 0 ? total : undefined;
}

async function syncBusinessCustomerFromJob(
  jobData: Job,
  tradesperson: BusinessCandidate | null,
  context: { event: "accepted" | "completed"; occurredAt?: Date }
): Promise<void> {
  if (!tradesperson) return;
  const isBusinessUser = tradesperson.role === "business_owner" || tradesperson.subscriptionTier === "business";
  if (!isBusinessUser) return;

  const ownerId = tradesperson.id;
  const contact = normaliseContact(jobData.customerContact);
  const customer = await ensureBusinessCustomer(ownerId, contact);

  if (context.event === "completed") {
    const occurredAt = context.occurredAt ?? jobData.completedDate ?? new Date();
    await customerService.recordInteraction(ownerId, customer.id, {
      note: `Job "${jobData.title}" marked complete.`,
      jobId: jobData.id,
      amount: getTotalJobPayments(jobData),
      followUpDate: occurredAt,
      createdBy: tradesperson.name || tradesperson.email || "Business"
    });
  }
}

export async function createQuote(tradespersonId: string, data: CreateQuoteData): Promise<Quote> {
  try {
    const tradesperson = (await userService.getUserById(tradespersonId)) as
      | (User & {
          subscriptionTier?: "basic" | "pro" | "business";
          monthlyQuotesUsed?: number;
          quoteResetDate?: Date | string | null;
          email?: string | null;
        })
      | null;

    if (!tradesperson) {
      throw new Error("Tradesperson not found.");
    }

    const tier: "basic" | "pro" | "business" = tradesperson.subscriptionTier ?? "basic";
    const now = new Date();

    const firstOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const quoteReset = tradesperson.quoteResetDate ? new Date(tradesperson.quoteResetDate) : undefined;
    const needsInit = !quoteReset || Number.isNaN(quoteReset.getTime());

    if (needsInit) {
      await userService.updateUser(tradespersonId, {
        monthlyQuotesUsed: 0,
        quoteResetDate: firstOfNextMonth
      });
      tradesperson.monthlyQuotesUsed = 0;
      tradesperson.quoteResetDate = firstOfNextMonth;
    }

    if (tradesperson.quoteResetDate && now >= new Date(tradesperson.quoteResetDate)) {
      await userService.updateUser(tradespersonId, {
        monthlyQuotesUsed: 0,
        quoteResetDate: firstOfNextMonth
      });
      tradesperson.monthlyQuotesUsed = 0;
      tradesperson.quoteResetDate = firstOfNextMonth;
    }

    if (tier === "basic") {
      const quoteLimit = 5;
      const used = tradesperson.monthlyQuotesUsed || 0;
      if (used >= quoteLimit) {
        throw new Error(
          `quote limit: You've reached your monthly quote limit (${quoteLimit}/${quoteLimit}). ` +
            `Upgrade to Pro for unlimited quotes.`
        );
      }
    }

    const jobRef = JobsCollection().doc(data.jobId);
    const quoteRef = jobRef.collection("quotes").doc();

    // ✅ Pull lineItems out separately so we can safely handle undefined
    const { lineItems, ...restData } = data;

    const quoteData: Record<string, unknown> = {
      ...restData,
      // ✅ Only include lineItems if it’s a non-empty array
      ...(Array.isArray(lineItems) && lineItems.length > 0 ? { lineItems } : {}),
      tradespersonId,
      tradespersonName: tradesperson.name,
      tradespersonPhone: tradesperson.phone,
      status: "pending",
      createdAt: now,
      updatedAt: now
    };

    // Keep your existing depositAmount normalisation
    if (!quoteData.depositAmount || (typeof quoteData.depositAmount === "number" && quoteData.depositAmount <= 0)) {
      delete quoteData.depositAmount;
    }

    await quoteRef.set(quoteData);

    // Track quote usage and mark the first submission so onboarding checklists can complete
    const userUpdatePayload: Partial<UpdateUserData> = {};

    if (tier === "basic") {
      userUpdatePayload.monthlyQuotesUsed = (tradesperson.monthlyQuotesUsed || 0) + 1;
    }

    if (!tradesperson.hasSubmittedQuote) {
      userUpdatePayload.hasSubmittedQuote = true;
    }

    if (Object.keys(userUpdatePayload).length > 0) {
      await userService.updateUser(tradespersonId, userUpdatePayload);
    }

    await jobRef.update({
      quoteCount: FieldValue.increment(1),
      updatedAt: now
    });

    const jobSnap = await jobRef.get();
    const jobData = jobSnap.data() as (Job & DocumentData) | undefined;

    if (jobSnap.exists && jobData?.customerId) {
      const chatRef = getAdminCollection(COLLECTIONS.CHATS).doc(data.jobId);
      await chatRef.set(
        {
          jobId: data.jobId,
          customerId: jobData.customerId,
          tradespersonId,
          createdAt: now
        },
        { merge: true }
      );

      await notificationService.createNotification(jobData.customerId, "new_quote", "New quote received", {
        jobId: data.jobId,
        quoteId: quoteRef.id
      });

      const customer = await userService.getUserById(jobData.customerId);

      if (customer?.email) {
        const recipientName = typeof customer.name === "string" ? customer.name : null;
        await emailService.sendNewQuoteEmail(customer.email, data.jobId, quoteRef.id, recipientName);
      }
    }

    const createdQuote: Quote = { id: quoteRef.id, ...quoteData } as unknown as Quote;
    return createdQuote;
  } catch (error) {
    logger.error("Error creating quote:", error);
    if (error instanceof Error) throw error;
    throw new Error("Failed to create quote");
  }
}

function parseDate(value: unknown): Date {
  if (typeof value === "object" && value !== null) {
    if (value instanceof Timestamp) return value.toDate();
    if (value instanceof Date) return value;
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
}

function parseOptionalDate(value: unknown): Date | undefined {
  if (!value) return undefined;

  if (typeof value === "object" && value !== null) {
    if (value instanceof Timestamp) return value.toDate();
    if (value instanceof Date) return value;
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return undefined;
}

function normalizeDeposit(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isNaN(value) || value <= 0 ? undefined : value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isNaN(parsed) || parsed <= 0 ? undefined : parsed;
  }
  return undefined;
}

function mapQuoteDocument(doc: QueryDocumentSnapshot<DocumentData>): Quote {
  const data = doc.data();

  const jobIdFromDoc = doc.ref.parent.parent?.id ?? "";
  const rawPrice = data.price;
  const price = typeof rawPrice === "number" ? rawPrice : Number(rawPrice) || 0;

  const rawLineItems = Array.isArray(data.lineItems) ? data.lineItems : undefined;

  return {
    id: doc.id,
    jobId: typeof data.jobId === "string" && data.jobId.length > 0 ? (data.jobId as string) : jobIdFromDoc,
    tradespersonId: data.tradespersonId as string,
    tradespersonName:
      typeof data.tradespersonName === "string" && data.tradespersonName.length > 0 ? data.tradespersonName : "N/A",
    tradespersonPhone:
      typeof data.tradespersonPhone === "string" && data.tradespersonPhone.length > 0 ? data.tradespersonPhone : "N/A",
    price,
    description: typeof data.description === "string" ? data.description : "",
    estimatedDuration: typeof data.estimatedDuration === "string" ? data.estimatedDuration : "",
    availableDate: parseDate(data.availableDate),
    status: (data.status as Quote["status"]) || "pending",
    depositAmount: normalizeDeposit(data.depositAmount),
    createdAt: parseDate(data.createdAt),
    updatedAt: parseDate(data.updatedAt),
    acceptedDate: parseOptionalDate(data.acceptedDate),

    // ✅ NEW: surface line items from Firestore into the Quote object
    lineItems: rawLineItems as QuoteLineItem[] | undefined
  };
}

export async function getQuotesByJobId(jobId: string): Promise<Quote[]> {
  try {
    const snapshot = await JobsCollection().doc(jobId).collection("quotes").orderBy("createdAt", "desc").get();
    return snapshot.docs.map(doc => mapQuoteDocument(doc));
  } catch (error) {
    logger.error("Error getting quotes:", error);
    throw new Error("Failed to get quotes");
  }
}

export async function getQuotesByTradespersonId(tradespersonId: string): Promise<Quote[]> {
  try {
    const jobsSnapshot = await JobsCollection().get();
    const allQuotes: (Quote & { acceptedDate?: Date })[] = [];

    for (const jobDoc of jobsSnapshot.docs) {
      const quotesSnapshot = await jobDoc.ref
        .collection("quotes")
        .where("tradespersonId", "==", tradespersonId)
        .orderBy("createdAt", "desc")
        .get();

      quotesSnapshot.docs.forEach(doc => {
        allQuotes.push(mapQuoteDocument(doc));
      });
    }

    const sortedQuotes = allQuotes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return sortedQuotes;
  } catch (error) {
    logger.error("Error getting quotes by tradesperson:", error);
    throw new Error("Failed to get quotes");
  }
}

export async function getAllQuotes(): Promise<Quote[]> {
  try {
    const db = getFirebaseAdminDb();
    const quotesSnapshot = await db.collectionGroup("quotes").get();
    if (quotesSnapshot.empty) return [];

    return quotesSnapshot.docs.map(doc => mapQuoteDocument(doc));
  } catch (error) {
    logger.error("Error getting all quotes:", error);
    throw new Error("Failed to get all quotes");
  }
}

export async function acceptQuote(jobId: string, quoteId: string, customerId: string): Promise<void> {
  const db = getFirebaseAdminDb();
  const jobRef = getAdminCollection(COLLECTIONS.JOBS).doc(jobId);
  const quoteRef = jobRef.collection("quotes").doc(quoteId);

  try {
    await db.runTransaction(async transaction => {
      const jobDoc = await transaction.get(jobRef);
      const quoteDoc = await transaction.get(quoteRef);

      if (!jobDoc.exists || !quoteDoc.exists) {
        throw new Error("Job or quote not found.");
      }

      const jobData = jobDoc.data() as Job;
      const quoteData = quoteDoc.data() as Quote;

      if (jobData.customerId !== customerId) {
        throw new Error("Forbidden: You can only accept quotes for your own jobs.");
      }
      if (jobData.status !== "open" && jobData.status !== "quoted") {
        throw new Error("This job is no longer open for quotes.");
      }

      const now = new Date();

      transaction.update(jobRef, {
        status: "assigned",
        tradespersonId: quoteData.tradespersonId,
        acceptedQuoteId: quoteId,
        updatedAt: now
      });

      transaction.update(quoteRef, {
        status: "accepted",
        acceptedDate: now,
        updatedAt: now
      });
    });

    const jobData = (await jobRef.get()).data() as Job;
    const quoteData = (await quoteRef.get()).data() as Quote;

    const tradesperson = await userService.getUserById(quoteData.tradespersonId);
    const customer = await userService.getUserById(customerId);

    if (tradesperson?.email) {
      const tradespersonName = typeof tradesperson.name === "string" ? tradesperson.name : null;

      await notificationService.createNotification(
        tradesperson.id,
        "quote_accepted",
        `Your quote for "${jobData.title}" was accepted!`,
        { jobId }
      );

      await emailService.sendQuoteAcceptedEmail(tradesperson.email, jobId, quoteId, tradespersonName);
    }

    if (customer?.email) {
      const customerName = typeof customer.name === "string" ? customer.name : null;

      await notificationService.createNotification(
        customer.id,
        "action_success",
        `You have accepted a quote for "${jobData.title}".`,
        { jobId }
      );

      await emailService.sendJobAcceptedEmail(customer.email, jobId, customerName);
    }

    await syncBusinessCustomerFromJob(jobData, tradesperson as BusinessCandidate | null, {
      event: "accepted",
      occurredAt: quoteData.acceptedDate instanceof Date ? quoteData.acceptedDate : undefined
    });
  } catch (error) {
    logger.error("Error in acceptQuote function:", error);
    throw new Error("Failed to accept the quote. Please try again.");
  }
}

export async function markJobComplete(jobId: string, tradespersonId: string): Promise<void> {
  try {
    const jobRef = JobsCollection().doc(jobId);
    const jobDoc = await jobRef.get();
    const jobData = jobDoc.data() as Job | undefined;

    if (!jobDoc.exists || jobData?.tradespersonId !== tradespersonId) {
      throw new Error("Unauthorized");
    }

    const tradesperson = await userService.getUserById(tradespersonId);

    const now = new Date();

    await jobRef.update({
      status: "completed",
      completedDate: now,
      updatedAt: now
    });

    await notificationService.createNotification(
      jobData.customerId,
      "job_completed",
      "Action Required: Pay Final Balance",
      { jobId }
    );

    const customer = await userService.getUserById(jobData.customerId);

    if (customer?.email) {
      const customerName = typeof customer.name === "string" ? customer.name : null;
      await emailService.sendFinalPaymentRequestEmail(customer.email, jobId, customerName ?? undefined);
    }

    await syncBusinessCustomerFromJob(jobData, tradesperson as BusinessCandidate | null, {
      event: "completed",
      occurredAt: now
    });
  } catch (error) {
    logger.error("Error marking job complete:", error);
    throw new Error("Failed to complete job");
  }
}
