jest.mock("@/lib/firebase/admin", () => ({
  JobsCollection: jest.fn(),
  getAdminCollection: jest.fn(),
  UsersCollection: jest.fn(),
  NotificationsCollection: jest.fn(),
  COLLECTIONS: {}
}));

import { jobService } from "../job-service";
import type { Job } from "@/lib/types/job";
import type { Quote } from "@/lib/types/quote";

describe("JobService status updates", () => {
  beforeEach(() => {
    (jobService as any).jobs = [
      {
        id: "j1",
        customerId: "c1",
        title: "Job",
        description: "desc",
        urgency: "soon",
        location: { postcode: "123" },
        customerContact: { name: "c", email: "c@example.com", phone: "1" },
        status: "open",
        createdAt: new Date(),
        updatedAt: new Date()
      } as Job
    ];
    (jobService as any).quotes = [
      {
        id: "q1",
        jobId: "j1",
        tradespersonId: "t1",
        price: 100,
        description: "quote",
        estimatedDuration: "1 day",
        availableDate: new Date(),
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date()
      } as Quote
    ];
  });

  it("acceptQuote assigns job and updates quote", async () => {
    await jobService.acceptQuote("j1", "q1", "c1");
    const job = (jobService as any).jobs[0];
    const quote = (jobService as any).quotes[0];
    expect(job.status).toBe("assigned");
    expect(job.tradespersonId).toBe("t1");
    expect(quote.status).toBe("accepted");
  });

  it("markJobComplete marks job completed", async () => {
    await jobService.acceptQuote("j1", "q1", "c1");
    await jobService.markJobComplete("j1", "t1");
    const job = (jobService as any).jobs[0];
    expect(job.status).toBe("completed");
    expect((job as any).completedDate).toBeInstanceOf(Date);
  });
});
