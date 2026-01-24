// src/lib/services/job-service.ts

import * as JobActions from "./job/actions";
import * as JobQuotes from "./job/quotes";
import * as JobSearch from "./job/search";
import * as JobSuggestions from "./job/suggestions";
import { config } from "@/lib/config/app-mode";
import type {
  Job,
  JobStatus,
  JobUrgency,
  CreateJobData,
  UpdateJobData,
  SearchParams,
  SearchResult
} from "@/lib/types/job";
import type { Quote, CreateQuoteData } from "@/lib/types/quote";
import { getFirebaseAdminDb, getAdminCollection, COLLECTIONS } from "@/lib/firebase/admin";
import { logger } from "@/lib/logger";
import { notificationService } from "@/lib/services/notification-service";
import type { SuggestionJob } from "./job/suggestions";

// Minimal chat representation used by the mock service for admin deletion tests.
type Chat = { jobId: string } & Record<string, unknown>;

export interface JobService {
  createJob(data: CreateJobData): Promise<Job>;
  getJobById(id: string): Promise<Job | null>;
  getJobsByCustomer(customerId: string): Promise<Job[]>;
  getAllJobs(): Promise<Job[]>;
  getTotalJobCount(): Promise<number>;
  getJobCountByStatus(status: JobStatus): Promise<number>;
  getAllQuotes(): Promise<Quote[]>;
  getOpenJobs(): Promise<Job[]>;
  getRecentOpenJobs(limit: number): Promise<Job[]>;
  getJobsForSuggestions(limit: number): Promise<SuggestionJob[]>;
  updateJob(id: string, data: UpdateJobData): Promise<Job>;
  updateJobStatus(id: string, status: JobStatus): Promise<void>;
  deleteJob(id: string): Promise<void>;
  adminDeleteJob(jobId: string): Promise<void>;
  searchJobs(params: SearchParams): Promise<SearchResult>;
  createQuote(tradespersonId: string, data: CreateQuoteData): Promise<Quote>;
  getQuotesByJobId(jobId: string): Promise<Quote[]>;
  getQuotesByTradespersonId(tradespersonId: string): Promise<Quote[]>;
  acceptQuote(jobId: string, quoteId: string, customerId: string): Promise<void>;
  markJobComplete(jobId: string, tradespersonId: string): Promise<void>;
}

class FirebaseJobService implements JobService {
  // ---------------------------------------------------------------------------
  // Actions – now returning mapped Job/Quote directly (no serializeFirestore)
  // ---------------------------------------------------------------------------
  async createJob(data: CreateJobData): Promise<Job> {
    const job = await JobActions.createJob(data);
    return job;
  }

  async getJobById(id: string): Promise<Job | null> {
    const job = await JobActions.getJobById(id);
    return job;
  }

  async getJobsByCustomer(customerId: string): Promise<Job[]> {
    const jobs = await JobActions.getJobsByCustomer(customerId);
    return jobs;
  }

  async getAllJobs(): Promise<Job[]> {
    const jobs = await JobActions.getAllJobs();
    return jobs;
  }

  async getTotalJobCount(): Promise<number> {
    return JobActions.getTotalJobCount();
  }

  async getJobCountByStatus(status: JobStatus): Promise<number> {
    return JobActions.getJobCountByStatus(status);
  }

  async getOpenJobs(): Promise<Job[]> {
    const jobs = await JobActions.getOpenJobs();
    return jobs;
  }

  async getRecentOpenJobs(limit: number): Promise<Job[]> {
    const jobs = await JobActions.getRecentOpenJobs(limit);
    return jobs;
  }

  async getJobsForSuggestions(limit: number): Promise<SuggestionJob[]> {
    const jobs = await JobSuggestions.getJobsForSuggestions(limit);
    // SuggestionJob is plain data already
    return jobs;
  }

  async updateJob(id: string, data: UpdateJobData): Promise<Job> {
    const job = await JobActions.updateJob(id, data);
    return job;
  }

  async updateJobStatus(id: string, status: JobStatus): Promise<void> {
    await JobActions.updateJobStatus(id, status);
  }

  async deleteJob(id: string): Promise<void> {
    await JobActions.deleteJob(id);
  }

  // ---------------------------------------------------------------------------
  // Quotes
  // ---------------------------------------------------------------------------
  async createQuote(tradespersonId: string, data: CreateQuoteData): Promise<Quote> {
    const quote = await JobQuotes.createQuote(tradespersonId, data);
    return quote;
  }

  async getQuotesByJobId(jobId: string): Promise<Quote[]> {
    const quotes = await JobQuotes.getQuotesByJobId(jobId);
    return quotes;
  }

  async getQuotesByTradespersonId(tradespersonId: string): Promise<Quote[]> {
    const quotes = await JobQuotes.getQuotesByTradespersonId(tradespersonId);
    return quotes;
  }

  async getAllQuotes(): Promise<Quote[]> {
    const quotes = await JobQuotes.getAllQuotes();
    return quotes;
  }

  async acceptQuote(jobId: string, quoteId: string, customerId: string): Promise<void> {
    await JobQuotes.acceptQuote(jobId, quoteId, customerId);
  }

  async markJobComplete(jobId: string, tradespersonId: string): Promise<void> {
    await JobQuotes.markJobComplete(jobId, tradespersonId);
  }

  // ---------------------------------------------------------------------------
  // Search (Algolia-backed)
  // ---------------------------------------------------------------------------
  async searchJobs(params: SearchParams): Promise<SearchResult> {
    const result = await JobSearch.searchJobs(params);
    return result;
  }

  // ---------------------------------------------------------------------------
  // Admin delete job with all associated data cleanup
  // (no serialization needed – nothing is returned to the client)
  // ---------------------------------------------------------------------------
  adminDeleteJob = async (jobId: string): Promise<void> => {
    const db = getFirebaseAdminDb();
    const batch = db.batch();
    const now = new Date();

    const jobRef = getAdminCollection(COLLECTIONS.JOBS).doc(jobId);
    const jobDoc = await jobRef.get();
    if (!jobDoc.exists) {
      return; // Job already deleted
    }
    const jobData = jobDoc.data() as Job | undefined;

    const chatRef = getAdminCollection(COLLECTIONS.CHATS).doc(jobId);

    const chatMessagesSnapshot = await chatRef.collection("messages").get();
    chatMessagesSnapshot.forEach(doc => batch.update(doc.ref, { deletedAt: now, deletedBy: "admin" }));

    const quotesSnapshot = await jobRef.collection("quotes").get();
    quotesSnapshot.forEach(doc => batch.update(doc.ref, { deletedAt: now, deletedBy: "admin" }));

    batch.update(jobRef, { deletedAt: now, deletedBy: "admin", deletionReason: "admin_removed" });
    batch.set(chatRef, { deletedAt: now }, { merge: true });

    await batch.commit();

    if (jobData) {
      const { customerId, tradespersonId } = jobData;
      const notificationTitle = "Job Removed by Admin";
      const notificationMessage = `The job "${jobData.title}" has been removed by an administrator.`;

      if (customerId) {
        await notificationService.createNotification(customerId, "job_removed", notificationTitle, {
          message: notificationMessage
        });
      }
      if (tradespersonId) {
        await notificationService.createNotification(tradespersonId, "job_removed", notificationTitle, {
          message: notificationMessage
        });
      }
    }
  };
}

export class MockJobService implements JobService {
  private jobs: Job[] = [];
  private quotes: Quote[] = [];
  private chats: Chat[] = [];

  constructor() {
    this.jobs = (global as { mockJobs?: Job[] }).mockJobs || [];
    this.quotes = (global as { mockQuotes?: Quote[] }).mockQuotes || [];
    this.chats = (global as { mockChats?: Chat[] }).mockChats || [];
  }

  async createJob(data: CreateJobData): Promise<Job> {
    const id = (this.jobs.length + 1).toString();
    const job: Job = {
      id,
      customerId: data.customerId,
      title: data.title,
      description: data.description,
      urgency: (data.urgency ?? "flexible") as JobUrgency,
      location: typeof data.location === "string" ? { postcode: data.location } : data.location,
      customerContact: {
        name: data.customerContact.name,
        email: data.customerContact.email,
        phone: data.customerContact.phone
      },
      status: "open",
      budget: data.budget,
      serviceType: data.serviceType,
      photos: data.photos,
      isFromOnboarding: data.isFromOnboarding || false,
      createdAt: new Date(),
      updatedAt: new Date(),
      scheduledDate: data.scheduledDate,
      quoteCount: 0
    };

    this.jobs.push(job);
    return job;
  }

  async getJobById(id: string): Promise<Job | null> {
    return this.jobs.find(job => job.id === id) || null;
  }

  async getJobsByCustomer(customerId: string): Promise<Job[]> {
    return this.jobs.filter(job => job.customerId === customerId);
  }

  async getAllJobs(): Promise<Job[]> {
    return [...this.jobs];
  }

  async getTotalJobCount(): Promise<number> {
    return this.jobs.length;
  }

  async getJobCountByStatus(status: JobStatus): Promise<number> {
    return this.jobs.filter(job => job.status === status).length;
  }

  async getAllQuotes(): Promise<Quote[]> {
    return [...this.quotes];
  }

  async getOpenJobs(): Promise<Job[]> {
    return this.jobs.filter(job => job.status === "open");
  }

  async getRecentOpenJobs(limit: number): Promise<Job[]> {
    return this.jobs
      .filter(job => job.status === "open")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getJobsForSuggestions(limit: number): Promise<SuggestionJob[]> {
    return this.jobs
      .filter(job => job.status === "open")
      .slice(0, limit)
      .map(job => ({
        title: job.title,
        serviceType: job.serviceType,
        location: { postcode: job.location.postcode }
      }));
  }

  async updateJob(id: string, data: UpdateJobData): Promise<Job> {
    const index = this.jobs.findIndex(j => j.id === id);
    if (index === -1) throw new Error("Job not found");
    const existing = this.jobs[index];
    const updated: Job = {
      ...existing,
      ...data,
      location: data.location ? { ...existing.location, ...data.location } : existing.location,
      updatedAt: new Date()
    } as Job;
    this.jobs[index] = updated;
    return updated;
  }

  async updateJobStatus(id: string, status: JobStatus): Promise<void> {
    const job = this.jobs.find(j => j.id === id);
    if (job) {
      job.status = status;
      job.updatedAt = new Date();
    }
  }

  async deleteJob(id: string): Promise<void> {
    this.jobs = this.jobs.filter(job => job.id !== id);
  }

  async adminDeleteJob(jobId: string): Promise<void> {
    this.quotes = this.quotes.filter(q => q.jobId !== jobId);
    this.jobs = this.jobs.filter(job => job.id !== jobId);
    this.chats = this.chats.filter(c => c.jobId !== jobId);
  }

  async searchJobs(params: SearchParams): Promise<SearchResult> {
    const {
      page = 1,
      limit = 20,
      location,
      radius,
      noQuotes,
      datePosted,
      sortBy,
      query,
      minBudget,
      maxBudget,
      serviceType
    } = params;

    let filteredJobs = this.jobs.filter(job => {
      if (job.status !== "open") return false;

      if (noQuotes && (job.quoteCount ?? 0) !== 0) return false;

      const wantedService = (serviceType ?? undefined)?.toString().toLowerCase();
      const wantedSkills = (params.skills ?? []).map(s => s.toLowerCase());

      if (wantedService) {
        if ((job.serviceType ?? "").toLowerCase() !== wantedService) return false;
      } else if (wantedSkills.length > 0) {
        const jobSkills = [job.serviceType ?? "", ...((Array.isArray(job.skills) ? job.skills : []) as string[])]
          .filter((skill): skill is string => Boolean(skill))
          .map(skill => skill.toLowerCase());
        const hasAll = wantedSkills.every(skill => jobSkills.includes(skill));
        if (!hasAll) return false;
      }

      if (datePosted) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - datePosted);
        if (new Date(job.createdAt) < cutoff) return false;
      }

      if (query) {
        const q = query.toLowerCase();
        const titleMatch = job.title?.toLowerCase().includes(q);
        const postcodeMatch = job.location.postcode?.toLowerCase().includes(q);
        if (!titleMatch && !postcodeMatch) return false;
      }

      if (typeof minBudget === "number" && (job.budget ?? 0) < minBudget) return false;
      if (typeof maxBudget === "number" && (job.budget ?? 0) > maxBudget) return false;

      return true;
    });

    if (location && radius) {
      const [lat, lon] = location.split(",").map(Number);
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        filteredJobs = filteredJobs.filter(job => {
          const jobLat = (job as any).location?.latitude;
          const jobLon = (job as any).location?.longitude;
          if (typeof jobLat !== "number" || typeof jobLon !== "number") return false;

          const distance = Math.sqrt(Math.pow(jobLat - lat, 2) + Math.pow(jobLon - lon, 2)) * 69;
          return distance <= radius;
        });
      }
    }

    if (sortBy === "budget_high") {
      filteredJobs.sort((a, b) => (b.budget || 0) - (a.budget || 0));
    } else if (sortBy === "budget_low") {
      filteredJobs.sort((a, b) => (a.budget || 0) - (b.budget || 0));
    } else if (sortBy === "newest") {
      filteredJobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    const totalJobs = filteredJobs.length;
    const totalPages = Math.ceil(totalJobs / limit);
    const paginatedJobs = filteredJobs.slice((page - 1) * limit, page * limit);

    return {
      jobs: paginatedJobs,
      pagination: {
        page,
        limit,
        totalJobs,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      filters: {
        query,
        location,
        radius,
        skills: params.skills,
        serviceType,
        noQuotes,
        datePosted,
        sortBy,
        hasActiveFilters: Boolean(
          query ||
            location ||
            radius ||
            (params.skills && params.skills.length > 0) ||
            serviceType ||
            noQuotes ||
            datePosted ||
            sortBy ||
            typeof minBudget === "number" ||
            typeof maxBudget === "number"
        )
      },
      stats: {
        totalAvailable: this.jobs.length,
        filtered: totalJobs,
        emergencyJobs: 0,
        avgBudget: 0
      }
    };
  }

  async createQuote(tradespersonId: string, data: CreateQuoteData): Promise<Quote> {
    const id = (this.quotes.length + 1).toString();
    const quote: Quote = {
      id,
      jobId: data.jobId,
      tradespersonId,
      tradespersonName: "Mock Tradesperson",
      tradespersonPhone: "07123456789",
      price: data.price,
      depositAmount: data.depositAmount,
      description: data.description,
      estimatedDuration: data.estimatedDuration,
      availableDate: data.availableDate,
      status: "pending",
      lineItems: data.lineItems && data.lineItems.length > 0 ? data.lineItems : undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.quotes.push(quote);
    const job = this.jobs.find(j => j.id === data.jobId);
    if (job) {
      job.quoteCount = (job.quoteCount || 0) + 1;
    }
    return quote;
  }

  async getQuotesByJobId(jobId: string): Promise<Quote[]> {
    return this.quotes.filter(q => q.jobId === jobId);
  }

  async getQuotesByTradespersonId(tradespersonId: string): Promise<Quote[]> {
    return this.quotes.filter(q => q.tradespersonId === tradespersonId);
  }

  async acceptQuote(jobId: string, quoteId: string, customerId: string): Promise<void> {
    const job = this.jobs.find(j => j.id === jobId && j.customerId === customerId);
    if (!job) throw new Error("Job not found or unauthorized");
    const quote = this.quotes.find(q => q.id === quoteId && q.jobId === jobId);
    if (!quote) throw new Error("Quote not found");
    quote.acceptedDate = new Date();
    quote.status = "accepted";
    quote.updatedAt = new Date();
    job.status = "assigned";
    job.tradespersonId = quote.tradespersonId;
    job.updatedAt = new Date();
  }

  async markJobComplete(jobId: string, tradespersonId: string): Promise<void> {
    const job = this.jobs.find(j => j.id === jobId && j.tradespersonId === tradespersonId);
    if (!job) throw new Error("Job not found or unauthorized");
    job.status = "completed";
    job.completedDate = new Date();
    job.updatedAt = new Date();
  }
}

class JobServiceFactory {
  private static instance: JobService | null = null;

  static getInstance(): JobService {
    if (config.isMockMode) {
      logger.info("🔧 JobServiceFactory: Using MockJobService");
      return new MockJobService();
    }

    if (!JobServiceFactory.instance) {
      logger.warn("🔧 JobServiceFactory: Using FirebaseJobService");
      JobServiceFactory.instance = new FirebaseJobService();
    }

    return JobServiceFactory.instance;
  }
}

export const jobService = JobServiceFactory.getInstance();
