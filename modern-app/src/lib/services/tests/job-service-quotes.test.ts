jest.mock("@/lib/firebase/admin", () => ({
  JobsCollection: jest.fn(),
  getAdminCollection: jest.fn(),
  UsersCollection: jest.fn(),
  NotificationsCollection: jest.fn(),
  COLLECTIONS: {}
}));

import { jobService } from "../job-service";
import type { Quote } from "@/lib/types/quote";

describe("JobService getQuotesByTradespersonId", () => {
  beforeEach(() => {
    (jobService as unknown as { quotes: Quote[] }).quotes = [];
  });

  it("returns quotes for the specified tradesperson", async () => {
    const tradespersonId = "t1";
    const otherTradespersonId = "t2";
    (jobService as unknown as { quotes: Quote[] }).quotes = [
      {
        id: "q1",
        jobId: "j1",
        tradespersonId,
        price: 100,
        description: "Quote 1",
        estimatedDuration: "1 day",
        availableDate: new Date(),
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date()
      } as Quote,
      {
        id: "q2",
        jobId: "j2",
        tradespersonId: otherTradespersonId,
        price: 200,
        description: "Quote 2",
        estimatedDuration: "2 days",
        availableDate: new Date(),
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date()
      } as Quote
    ];

    const quotes = await jobService.getQuotesByTradespersonId(tradespersonId);
    expect(quotes).toHaveLength(1);
    expect(quotes[0].id).toBe("q1");
  });
});
