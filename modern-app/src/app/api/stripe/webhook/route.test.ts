// All of the mock references for the Firebase Admin layer live in a separate
// helper module so they can be imported from both the jest.mock factory and the
// tests themselves without running into hoisting issues.
import {
  mockQuoteSet,
  mockJobSet,
  mockJobGet,
  mockUserDocUpdate,
  mockUsersCollectionWhere,
  mockDbCollection
} from "./test-helpers/firebaseAdminMocks";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, init?: any) => ({
      ...body,
      status: init?.status ?? 200,
      json: async () => body
    })
  }
}));

jest.mock("@/lib/stripe/server", () => ({
  stripe: {
    webhooks: { constructEvent: jest.fn() },
    checkout: { sessions: { retrieve: jest.fn() } },
    paymentIntents: { retrieve: jest.fn() },
    subscriptions: { retrieve: jest.fn() }
  }
}));

// The mock implementation uses the globally defined spies directly.
jest.mock("@/lib/firebase/admin", () => {
  const mockEventLogDoc = {
    get: jest.fn().mockResolvedValue({ exists: false }),
    set: jest.fn()
  };

  // Helper functions that rely on the global spies defined at the top of the file
  const mockQuoteDocFn = () => ({ set: mockQuoteSet });

  const mockJobDocFn = jest.fn().mockImplementation(() => ({
    collection: jest.fn().mockImplementation(() => ({
      doc: jest.fn().mockImplementation(mockQuoteDocFn)
    })),
    set: mockJobSet,
    get: mockJobGet
  }));

  const mockUserDocFn = jest.fn().mockImplementation(() => ({
    update: mockUserDocUpdate,
    get: jest.fn()
  }));

  const mockDb = {
    // getFirebaseAdminDb returns this mockDb object
    collection: mockDbCollection
  };

  mockDbCollection.mockImplementation((name: string) => {
    if (name === "users") {
      return { where: mockUsersCollectionWhere, doc: mockUserDocFn };
    }
    if (name === "activity_logs") return { doc: jest.fn().mockImplementation(() => mockEventLogDoc) };
    // This is the important path for the invoice test to correctly access the collection spy
    if (name in { users: 1, activity_logs: 1 }) return { doc: jest.fn() };
    return { doc: jest.fn() };
  });

  return {
    UsersCollection: jest.fn().mockImplementation(() => ({
      doc: mockUserDocFn,
      where: mockUsersCollectionWhere
    })),
    JobsCollection: jest.fn().mockImplementation(() => ({ doc: mockJobDocFn })),
    getFirebaseAdminDb: jest.fn().mockImplementation(() => mockDb),
    COLLECTIONS: { USERS: "users", ACTIVITY_LOGS: "activity_logs" }
  };
});

jest.mock("@/lib/services/user-service", () => ({
  userService: {
    getUserById: jest.fn(),
    updateUser: jest.fn()
  }
}));

jest.mock("@/lib/env", () => ({
  getEnv: jest.fn(() => ({
    STRIPE_PRO_PRICE_MONTHLY: "price_pro_monthly",
    STRIPE_PRO_PRICE_YEARLY: "price_pro_yearly",
    STRIPE_BUSINESS_PRICE_MONTHLY: "price_business_monthly",
    STRIPE_BUSINESS_PRICE_YEARLY: "price_business_yearly"
  }))
}));

jest.mock("@/lib/email/email-service", () => ({
  emailService: {
    sendDepositPaidEmail: jest.fn().mockResolvedValue(true),
    sendJobCompleteEmail: jest.fn().mockResolvedValue(true),
    sendFinalPaymentPaidEmail: jest.fn().mockResolvedValue(true),
    sendStripeOnboardingSuccessEmail: jest.fn().mockResolvedValue(true),
    sendSubscriptionUpgradedEmail: jest.fn().mockResolvedValue(true)
  }
}));

import { stripe } from "@/lib/stripe/server";
import { UsersCollection, JobsCollection, getFirebaseAdminDb } from "@/lib/firebase/admin";
import { userService } from "@/lib/services/user-service";
import { emailService } from "@/lib/email/email-service";
import { POST } from "./route";

describe("stripe webhook route", () => {
  beforeEach(() => {
    // DO NOT RE-ASSIGN mock functions here (e.g., mockQuoteSet = jest.fn()).
    // Only clear calls and set up mock implementations.

    // Clear calls on all global spies
    mockQuoteSet.mockClear();
    mockJobSet.mockClear();
    mockJobGet.mockClear();
    mockUserDocUpdate.mockClear();
    mockUsersCollectionWhere.mockClear();
    mockDbCollection.mockClear();

    // Default mock implementation for mockUsersCollectionWhere (needed for subscription checks)
    const mockUserSnap = {
      empty: false,
      docs: [{ ref: { update: mockUserDocUpdate }, data: () => ({ subscriptionTier: "pro" }) }]
    };
    // The implementation for where is set/reset here.
    mockUsersCollectionWhere.mockImplementation(() => ({
      limit: jest.fn(() => ({ get: jest.fn().mockResolvedValue(mockUserSnap) }))
    }));

    process.env.STRIPE_WEBHOOK_SECRET = "whsec";

    // Clear high-level mock history managed by jest
    jest.clearAllMocks();

    // Re-set mock implementations/resolutions for external services
    (stripe.webhooks.constructEvent as jest.Mock).mockReset();
    (stripe.checkout.sessions.retrieve as jest.Mock).mockReset();
    (stripe.subscriptions.retrieve as jest.Mock).mockReset(); // Reset subscription retrieve mock
    (userService.getUserById as jest.Mock).mockReset().mockResolvedValue(null);
    (userService.updateUser as jest.Mock).mockReset();
    (emailService.sendSubscriptionUpgradedEmail as jest.Mock).mockReset().mockResolvedValue(true);

    // Mock job doc getter to return default data for payment tests
    mockJobGet.mockResolvedValue({
      data: () => ({ customerId: "c1", tradespersonId: "t1", title: "Job Title" }),
      exists: true
    });
  });

  it("handles checkout session completion", async () => {
    // Mock user update return
    (userService.updateUser as jest.Mock).mockResolvedValue({
      id: "user1",
      subscriptionTier: "pro",
      stripeCustomerId: "cus_123"
    });

    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      id: "evt_checkout_subscription",
      type: "checkout.session.completed",
      data: {
        object: {
          mode: "subscription",
          customer: "cus_123",
          metadata: { userId: "user1", tier: "pro" }
        }
      }
    });

    const req: any = {
      arrayBuffer: async () => Buffer.from("{}", "utf-8"),
      headers: new Headers({ "stripe-signature": "sig" })
    };
    const res = await POST(req);
    expect(res.status).toBe(200);
    // Verify high-level update call
    expect(userService.updateUser).toHaveBeenCalledWith(
      "user1",
      expect.objectContaining({ stripeCustomerId: "cus_123", subscriptionTier: "pro" })
    );
  });

  it("does NOT send a subscription upgraded email when a subscription checkout completes (handled by subscription.updated)", async () => {
    // Mock user update result to ensure email/name exist for email send
    const mockUserUpdateResult = {
      id: "user-upgrade",
      subscriptionTier: "pro",
      stripeCustomerId: "cus_789",
      email: "trade@example.com",
      name: "Taylor Plumb"
    };
    (userService.updateUser as jest.Mock).mockResolvedValue(mockUserUpdateResult);

    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      id: "evt_checkout_upgrade_email",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test",
          mode: "subscription",
          customer: "cus_789",
          metadata: { userId: "user-upgrade", tier: "pro" }
        }
      }
    });

    const mockUser = {
      id: "user-upgrade",
      email: "trade@example.com",
      name: "Taylor Plumb",
      firstName: "Taylor",
      lastName: "Plumb"
    };
    (userService.getUserById as jest.Mock).mockResolvedValueOnce(mockUser);

    const req: any = {
      arrayBuffer: async () => Buffer.from("{}", "utf-8"),
      headers: new Headers({ "stripe-signature": "sig" })
    };
    const res = await POST(req);

    expect(res.status).toBe(200);
    // Verify email service call is NOT made (it is deferred to the subscription update webhook)
    expect(emailService.sendSubscriptionUpgradedEmail).not.toHaveBeenCalled();
  });

  it("sends a subscription upgraded email when Stripe reports a paid tier change", async () => {
    // Mock initial user read to be 'basic'
    const currentUser = {
      id: "user-portal",
      email: "portal@example.com",
      name: "Porter Trade",
      subscriptionTier: "basic"
    };
    (userService.getUserById as jest.Mock).mockResolvedValueOnce(currentUser);
    // Mock update to ensure success and is used by the email call
    (userService.updateUser as jest.Mock).mockResolvedValue({
      ...currentUser,
      subscriptionTier: "pro",
      subscriptionStatus: "active"
    });

    const subObject = {
      id: "sub_789",
      status: "active",
      customer: "cus_portal",
      metadata: { userId: "user-portal", tier: "pro" },
      items: {
        data: [
          {
            price: { id: "price_pro_monthly" }
          }
        ]
      },
      current_period_end: Math.floor(Date.now() / 1000) + 86400
    };

    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      id: "evt_subscription_upgrade",
      type: "customer.subscription.updated",
      data: {
        object: subObject
      }
    });

    // MOCK THE RETRIEVE CALL TO AVOID 500
    (stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue(subObject);

    // Clear the update spy from the global mock before this test
    mockUserDocUpdate.mockClear();

    const req: any = {
      arrayBuffer: async () => Buffer.from("{}", "utf-8"),
      headers: new Headers({ "stripe-signature": "sig" })
    };

    const res = await POST(req);

    expect(res.status).toBe(200);
    // Verify high-level update call
    expect(userService.updateUser).toHaveBeenCalledWith(
      "user-portal",
      expect.objectContaining({ subscriptionTier: "pro" })
    );
    // Verify email service call
    expect(emailService.sendSubscriptionUpgradedEmail).toHaveBeenCalledWith(
      "portal@example.com",
      "Porter Trade",
      "pro"
    );
  });

  it("updates job payment records from payment intent events", async () => {
    // Reset mutations mock to ensure only this test's calls are counted
    mockQuoteSet.mockClear();
    mockJobSet.mockClear();

    // Mock PI event to succeed
    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      id: "evt_payment_intent",
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_1",
          amount: 1000, // 10.00 GBP
          currency: "gbp",
          capture_method: "automatic",
          status: "succeeded",
          metadata: { jobId: "job1", quoteId: "quote1", paymentType: "deposit" },
          created: Date.now() / 1000 // Mock created timestamp
        }
      }
    });

    const req: any = {
      arrayBuffer: async () => Buffer.from("{}", "utf-8"),
      headers: new Headers({ "stripe-signature": "sig" })
    };
    const res = await POST(req);
    expect(res.status).toBe(200);
    // Verify low-level set calls
    expect(mockQuoteSet).toHaveBeenCalled();
    expect(mockJobSet).toHaveBeenCalled();
  });

  it("updates user on subscription changes", async () => {
    // Mock initial user read to be null/basic
    (userService.getUserById as jest.Mock).mockResolvedValueOnce({ id: "user-portal", subscriptionTier: "basic" });
    // Mock successful update
    (userService.updateUser as jest.Mock).mockResolvedValue({ id: "user-portal", subscriptionStatus: "active" });

    const subObject = {
      id: "sub_update",
      customer: "cus_123",
      status: "active",
      metadata: { userId: "user-portal" },
      items: { data: [{ price: { id: "price_pro" } }] },
      current_period_end: Math.floor(Date.now() / 1000) + 86400
    };

    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      id: "evt_subscription_update",
      type: "customer.subscription.updated",
      data: {
        object: subObject
      }
    });

    // MOCK THE RETRIEVE CALL TO AVOID 500
    (stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue(subObject);

    // Clear the update spy from the global mock before this test
    mockUserDocUpdate.mockClear();

    const req: any = {
      arrayBuffer: async () => Buffer.from("{}", "utf-8"),
      headers: new Headers({ "stripe-signature": "sig" })
    };
    const res = await POST(req);
    expect(res.status).toBe(200);
    // Verify high-level update call
    expect(userService.updateUser).toHaveBeenCalledWith(
      "user-portal",
      expect.objectContaining({ subscriptionStatus: "active" })
    );
  });

  it("marks users past due on failed invoices", async () => {
    // Mock the retrieval of the full subscription object
    (stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue({
      id: "sub_123",
      customer: "cus_123",
      status: "past_due"
    });

    // Create a specific spy for the update call in this test
    const updateSpy = jest.fn();

    // Temporarily override the mock function to return our spy
    mockUsersCollectionWhere.mockImplementationOnce(() => ({
      limit: jest.fn(() => ({
        get: jest.fn().mockResolvedValueOnce({
          empty: false,
          docs: [{ ref: { update: updateSpy }, data: () => ({ subscriptionTier: "pro", email: "user@example.com" }) }]
        })
      }))
    }));

    // Mock the constructEvent with a subscription ID in the invoice
    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      id: "evt_invoice_failed",
      type: "invoice.payment_failed",
      data: { object: { customer: "cus_123", subscription: "sub_123", lines: { data: [{}] } } }
    });

    const req: any = {
      arrayBuffer: async () => Buffer.from("{}", "utf-8"),
      headers: new Headers({ "stripe-signature": "sig" })
    };
    const res = await POST(req);
    expect(res.status).toBe(200);
    // Verify low-level update is called to update subscriptionStatus
    expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({ subscriptionStatus: "past_due" }));
  });
});
