jest.mock("@/lib/firebase/admin", () => ({
  JobsCollection: jest.fn(),
  getAdminCollection: jest.fn(),
  UsersCollection: jest.fn(),
  NotificationsCollection: jest.fn(),
  COLLECTIONS: {}
}));

import { jobService } from "../job-service";
import type { Job } from "@/lib/types/job";

describe("JobService searchJobs", () => {
  beforeEach(() => {
    // Reset jobs in mock service
    (jobService as any).jobs = [];
  });

  function makeJob(overrides: Partial<Job>): Job {
    return {
      id: overrides.id || Math.random().toString(),
      customerId: "c1",
      title: "Test Job",
      description: "Test Description",
      urgency: "flexible",
      location: { postcode: "PC1", latitude: 51.5, longitude: -0.1 },
      customerContact: { name: "A", email: "a@b.com", phone: "123" },
      status: "open",
      budget: 100,
      serviceType: "Repair",
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2023-01-01"),
      skills: ["Leak Repairs"],
      quoteCount: 0,
      ...overrides
    } as Job;
  }

  it("filters by query and skills", async () => {
    (jobService as any).jobs = [
      makeJob({ id: "1", title: "Fix leak", skills: ["Leak Repairs"] }),
      makeJob({ id: "2", title: "Install sink", skills: ["Installation"] })
    ];

    const result = await jobService.searchJobs({ query: "leak", skills: ["Leak Repairs"] });

    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0].id).toBe("1");
    // ensure filters are flagged when using query/skills
    expect(result.filters.hasActiveFilters).toBe(true);
  });

  it("filters by location and radius", async () => {
    (jobService as any).jobs = [
      makeJob({ id: "1", location: { postcode: "PC1", latitude: 51.5, longitude: -0.1 } }),
      makeJob({ id: "2", location: { postcode: "PC2", latitude: 55, longitude: -2 } })
    ];

    const result = await jobService.searchJobs({ location: "51.5,-0.1", radius: 10 });

    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0].id).toBe("1");
  });

  it("filters by postcode in query", async () => {
    (jobService as any).jobs = [
      makeJob({ id: "1", location: { postcode: "PC1", latitude: 0, longitude: 0 } }),
      makeJob({ id: "2", location: { postcode: "PC2", latitude: 0, longitude: 0 } })
    ];

    const result = await jobService.searchJobs({ query: "PC1" });

    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0].id).toBe("1");
  });

  it("sorts and paginates results", async () => {
    (jobService as any).jobs = [
      makeJob({ id: "1", budget: 100, createdAt: new Date("2023-01-01") }),
      makeJob({ id: "2", budget: 300, createdAt: new Date("2023-01-02") }),
      makeJob({ id: "3", budget: 200, createdAt: new Date("2023-01-03") })
    ];

    const result = await jobService.searchJobs({ sortBy: "budget_high", page: 1, limit: 2 });

    expect(result.jobs).toHaveLength(2);
    expect(result.jobs[0].budget).toBe(300);
    expect(result.jobs[1].budget).toBe(200);
    expect(result.pagination.hasNextPage).toBe(true);
  });

  it("filters by no quotes", async () => {
    (jobService as any).jobs = [
      makeJob({ id: "1", quoteCount: 0 }),
      makeJob({ id: "2", quoteCount: 2 })
    ];

    const result = await jobService.searchJobs({ noQuotes: true });

    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0].id).toBe("1");
  });

  it("filters by date posted", async () => {
    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    (jobService as any).jobs = [
      makeJob({ id: "1", createdAt: now }),
      makeJob({ id: "2", createdAt: fiveDaysAgo })
    ];

    const result = await jobService.searchJobs({ datePosted: 3 });

    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0].id).toBe("1");
  });
});

