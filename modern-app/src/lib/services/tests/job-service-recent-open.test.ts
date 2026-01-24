jest.mock("@/lib/firebase/admin", () => ({
  JobsCollection: jest.fn(),
  getAdminCollection: jest.fn(),
  UsersCollection: jest.fn(),
  NotificationsCollection: jest.fn(),
  COLLECTIONS: {},
}));

import { jobService } from "../job-service";
import type { Job } from "@/lib/types/job";

describe("JobService getRecentOpenJobs", () => {
  beforeEach(() => {
    const now = new Date();
    (jobService as any).jobs = [
      {
        id: "1",
        customerId: "c",
        title: "Job1",
        description: "desc1",
        urgency: "soon",
        location: { postcode: "p1" },
        customerContact: { name: "n", email: "e", phone: "p" },
        status: "open",
        createdAt: new Date(now.getTime() - 1000),
        updatedAt: new Date(now.getTime() - 1000),
      } as Job,
      {
        id: "2",
        customerId: "c",
        title: "Job2",
        description: "desc2",
        urgency: "soon",
        location: { postcode: "p2" },
        customerContact: { name: "n", email: "e", phone: "p" },
        status: "completed",
        createdAt: new Date(now.getTime() - 500),
        updatedAt: new Date(now.getTime() - 500),
      } as Job,
      {
        id: "3",
        customerId: "c",
        title: "Job3",
        description: "desc3",
        urgency: "soon",
        location: { postcode: "p3" },
        customerContact: { name: "n", email: "e", phone: "p" },
        status: "open",
        createdAt: new Date(now.getTime() - 200),
        updatedAt: new Date(now.getTime() - 200),
      } as Job,
    ];
  });

  it("returns open jobs sorted by createdAt desc and limited", async () => {
    const jobs = await jobService.getRecentOpenJobs(2);
    expect(jobs.map(j => j.id)).toEqual(["3", "1"]);
  });
});
