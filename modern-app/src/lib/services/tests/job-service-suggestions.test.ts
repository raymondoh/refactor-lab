jest.mock("@/lib/firebase/admin", () => ({
  JobsCollection: jest.fn(),
  getAdminCollection: jest.fn(),
  UsersCollection: jest.fn(),
  NotificationsCollection: jest.fn(),
  COLLECTIONS: {}
}));

import { jobService } from "../job-service";
import type { Job } from "@/lib/types/job";

describe("JobService getJobsForSuggestions", () => {
  beforeEach(() => {
    const now = new Date();
    // Directly manipulating the mock/private state for test setup
    (jobService as any).jobs = [
      {
        id: "1",
        customerId: "c1",
        title: "Some job",
        description: "Some description",
        urgency: "soon",
        location: { postcode: "E1 1AA" },
        customerContact: { name: "Customer One", email: "c1@example.com", phone: "07123 456789" },
        status: "open",
        createdAt: new Date(),
        updatedAt: new Date(),
        serviceType: "Repair"
      } as unknown as Job,

      {
        id: "2",
        customerId: "c",
        title: "Closed job",
        description: "desc",
        urgency: "soon",
        location: { postcode: "P2" },
        customerContact: { name: "n", email: "e", phone: "p" },
        status: "completed",
        createdAt: now,
        updatedAt: now,
        serviceType: "Install"
      } as unknown as Job,
      {
        id: "3",
        customerId: "c",
        title: "Install sink",
        description: "desc",
        urgency: "soon",
        location: { postcode: "P3" },
        customerContact: { name: "n", email: "e", phone: "p" },
        status: "open",
        createdAt: now,
        updatedAt: now,
        serviceType: "Install"
      } as unknown as Job
    ];
  });

  it("returns open jobs with suggestion fields and respects limit", async () => {
    const limited = await jobService.getJobsForSuggestions(1);
    // FIX: Updated expectation to match the data defined in beforeEach (Some job, E1 1AA)
    expect(limited).toEqual([{ title: "Some job", serviceType: "Repair", location: { postcode: "E1 1AA" } }]);

    const all = await jobService.getJobsForSuggestions(5);
    // FIX: Updated expectation to match the data defined in beforeEach
    expect(all).toEqual([
      { title: "Some job", serviceType: "Repair", location: { postcode: "E1 1AA" } },
      { title: "Install sink", serviceType: "Install", location: { postcode: "P3" } }
    ]);
  });
});
