jest.mock("@/lib/firebase/admin", () => ({
  JobsCollection: jest.fn(),
  getAdminCollection: jest.fn(),
  COLLECTIONS: { CHATS: "chats" }
}));

jest.mock("firebase-admin/firestore", () => ({
  FieldValue: { increment: jest.fn(() => 1) }
}));

jest.mock("@/lib/services/user-service", () => ({
  userService: { getUserById: jest.fn(), updateUser: jest.fn() }
}));

jest.mock("@/lib/services/notification-service", () => ({
  notificationService: { createNotification: jest.fn() }
}));

jest.mock("@/lib/email/email-service", () => ({
  emailService: { sendNewQuoteEmail: jest.fn() }
}));

import type { CreateQuoteData } from "@/lib/types/quote";
import { JobsCollection, getAdminCollection } from "@/lib/firebase/admin";
import { userService } from "@/lib/services/user-service";
import { createQuote } from "../job/quotes";

function mockJobRef() {
  const quoteRef = { id: "q1", set: jest.fn() };
  const quotesCol = { doc: jest.fn(() => quoteRef) };
  const jobRef = {
    collection: jest.fn(() => quotesCol),
    update: jest.fn(),
    get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({ customerId: "c1" }) }))
  };
  return { jobRef, quoteRef };
}

describe("jobService.createQuote monthly limit", () => {
  const quoteData: CreateQuoteData = {
    jobId: "j1",
    price: 100,
    description: "desc",
    estimatedDuration: "1 day",
    availableDate: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("increments monthly usage for basic tradespeople", async () => {
    const user = {
      id: "t1",
      subscriptionTier: "basic",
      monthlyQuotesUsed: 4,
      quoteResetDate: new Date(Date.now() + 86400000),
      hasSubmittedQuote: true // ✅ Fix: Prevents unexpected update call for this field
    };
    (userService.getUserById as jest.Mock).mockResolvedValue(user);
    (userService.updateUser as jest.Mock).mockImplementation(async (_id: string, update: any) => {
      Object.assign(user, update);
    });

    const { jobRef } = mockJobRef();
    (JobsCollection as jest.Mock).mockReturnValue({ doc: () => jobRef });
    (getAdminCollection as jest.Mock).mockReturnValue({ doc: () => ({ set: jest.fn() }) });

    await createQuote("t1", quoteData);

    expect(userService.updateUser).toHaveBeenCalledWith("t1", { monthlyQuotesUsed: 5 });
    expect(user.monthlyQuotesUsed).toBe(5);
  });

  it("throws when basic tradesperson exceeds monthly limit", async () => {
    const user = {
      id: "t1",
      subscriptionTier: "basic",
      monthlyQuotesUsed: 5,
      quoteResetDate: new Date(Date.now() + 86400000)
    };
    (userService.getUserById as jest.Mock).mockResolvedValue(user);

    await expect(createQuote("t1", quoteData)).rejects.toThrow(/quote limit/i);
  });
});
