// src/lib/services/tests/quote-email-notifications.test.ts
jest.mock("@/lib/firebase/admin", () => ({
  JobsCollection: jest.fn(),
  getAdminCollection: jest.fn(),
  COLLECTIONS: { CHATS: "chats" },
  getFirebaseAdminDb: jest.fn()
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
  emailService: {
    sendNewQuoteEmail: jest.fn(),
    sendQuoteAcceptedEmail: jest.fn(),
    sendJobAcceptedEmail: jest.fn()
  }
}));

import { createQuote, acceptQuote } from "../job/quotes";
import { JobsCollection, getAdminCollection, getFirebaseAdminDb } from "@/lib/firebase/admin";
import { userService } from "@/lib/services/user-service";
import { emailService } from "@/lib/email/email-service";

const mockJobRef = () => {
  const quoteRef = {
    id: "q1",
    set: jest.fn(),
    get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({ tradespersonId: "t1" }) })),
    update: jest.fn()
  };
  const quotesCol = { doc: jest.fn(() => quoteRef) };
  const jobData = { customerId: "c1", title: "Test Job", status: "open" };
  const jobRef = {
    get: jest.fn(() => Promise.resolve({ exists: true, data: () => jobData })),
    update: jest.fn(),
    collection: jest.fn(() => quotesCol)
  };
  return { jobRef, quoteRef };
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("quote email notifications", () => {
  it("sends an email to the customer when a new quote is created", async () => {
    const { jobRef, quoteRef } = mockJobRef();
    (JobsCollection as jest.Mock).mockReturnValue({ doc: () => jobRef });
    (getAdminCollection as jest.Mock).mockReturnValue({ doc: () => ({ set: jest.fn() }) });
    (userService.getUserById as jest.Mock).mockImplementation(async id => {
      if (id === "t1") return { id: "t1", subscriptionTier: "pro" };
      if (id === "c1") return { id: "c1", email: "c1@example.com" }; // Name is missing, so it defaults to null
    });

    await createQuote("t1", {
      jobId: "j1",
      price: 100,
      description: "desc",
      estimatedDuration: "1 day",
      availableDate: new Date()
    });

    // Updated: Added `null` as the 4th argument (recipientName)
    expect(emailService.sendNewQuoteEmail).toHaveBeenCalledWith("c1@example.com", "j1", quoteRef.id, null);
  });

  it("sends emails to both parties when a quote is accepted", async () => {
    const { jobRef, quoteRef } = mockJobRef();
    (getAdminCollection as jest.Mock).mockReturnValue({ doc: () => jobRef });
    const transaction = { get: (ref: any) => ref.get(), update: jest.fn() };
    (getFirebaseAdminDb as jest.Mock).mockReturnValue({
      runTransaction: async (cb: any) => cb(transaction)
    });
    (userService.getUserById as jest.Mock).mockImplementation(async id => {
      if (id === "t1") return { id: "t1", email: "t1@example.com" };
      if (id === "c1") return { id: "c1", email: "c1@example.com" };
    });

    await acceptQuote("j1", "q1", "c1");

    // Updated: Added `null` as the last argument for both calls (name)
    expect(emailService.sendQuoteAcceptedEmail).toHaveBeenCalledWith("t1@example.com", "j1", "q1", null);
    expect(emailService.sendJobAcceptedEmail).toHaveBeenCalledWith("c1@example.com", "j1", null);
  });
});
