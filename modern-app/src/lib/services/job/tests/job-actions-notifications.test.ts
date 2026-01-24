// src/lib/services/job/tests/job-actions-notifications.test.ts
import type { CreateJobData } from "@/lib/types/job";

const addMock = jest.fn();
const getCoordinatesFromPostcodeMock = jest.fn();
const findMatchingTradespeopleMock = jest.fn();
const createNotificationMock = jest.fn();
const sendNewJobAlertEmailMock = jest.fn();

jest.mock("@/lib/firebase/admin", () => ({
  JobsCollection: () => ({
    add: addMock
  })
}));

jest.mock("@/lib/services/geocoding-service", () => ({
  geocodingService: {
    getCoordinatesFromPostcode: getCoordinatesFromPostcodeMock
  }
}));

jest.mock("@/lib/services/user/actions", () => ({
  findMatchingTradespeople: (job: unknown) => findMatchingTradespeopleMock(job)
}));

jest.mock("@/lib/services/notification-service", () => ({
  notificationService: {
    createNotification: createNotificationMock
  }
}));

jest.mock("@/lib/email/email-service", () => ({
  emailService: {
    sendNewJobAlertEmail: sendNewJobAlertEmailMock
  }
}));

describe("createJob notifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    addMock.mockResolvedValue({ id: "job-123" });
    getCoordinatesFromPostcodeMock.mockResolvedValue(null);
    createNotificationMock.mockResolvedValue(undefined);
    sendNewJobAlertEmailMock.mockResolvedValue(undefined);
  });

  // UPDATED: Test description reflects that ALL matched tradespeople get alerts
  it("sends email alerts to all matched tradespeople (Pro, Business, and Basic)", async () => {
    const { createJob } = await import("@/lib/services/job/actions");

    // Mock returns 1 Pro and 1 Basic user
    findMatchingTradespeopleMock.mockResolvedValue({
      businessTier: [],
      proTier: [
        {
          id: "pro-user",
          email: "pro@test.com",
          firstName: "Patricia",
          name: "Patricia Pro"
        }
      ],
      basicTier: [
        {
          id: "basic-user",
          email: "basic@test.com",
          name: "Basic User"
        }
      ]
    });

    const jobData: CreateJobData = {
      customerId: "customer-1",
      title: "Boiler Repair Needed",
      description: "Boiler not working.",
      location: { postcode: "AB12 3CD" },
      customerContact: {
        name: "John Doe",
        email: "john@example.com",
        phone: "01234 567890"
      },
      serviceType: "Boiler Repair" as any
    };

    await createJob(jobData);

    // 1. Verify in-app notifications (should be 2)
    expect(createNotificationMock).toHaveBeenCalledTimes(2);

    // 2. Verify Emails - UPDATED EXPECTATION
    // We now expect 2 emails because you are sending to ALL tiers
    expect(sendNewJobAlertEmailMock).toHaveBeenCalledTimes(2);

    // Verify Pro user got one
    expect(sendNewJobAlertEmailMock).toHaveBeenCalledWith(
      "pro@test.com",
      expect.objectContaining({ id: "job-123" }),
      "Patricia"
    );

    // Verify Basic user got one
    expect(sendNewJobAlertEmailMock).toHaveBeenCalledWith(
      "basic@test.com",
      expect.objectContaining({ id: "job-123" }),
      "Basic User" // Falls back to 'name' since firstName is undefined in mock
    );
  });
});
