import { analyticsService } from "@/lib/services/analytics-service";
import type { Job } from "@/lib/types/job";
import type { User } from "@/lib/types/user";

jest.mock("@/lib/services/user-service", () => ({
  userService: {
    getAllUsers: jest.fn()
  }
}));

jest.mock("@/lib/services/job-service", () => ({
  jobService: {
    getAllJobs: jest.fn()
  }
}));

const { userService } = jest.requireMock("@/lib/services/user-service") as {
  userService: { getAllUsers: jest.Mock };
};

const { jobService } = jest.requireMock("@/lib/services/job-service") as {
  jobService: { getAllJobs: jest.Mock };
};

describe("analyticsService", () => {
  const baseUsers: User[] = [
    {
      id: "customer-1",
      email: "customer1@example.com",
      role: "customer",
      onboardingComplete: true,
      createdAt: new Date("2024-01-02T00:00:00Z"),
      updatedAt: new Date("2024-01-02T00:00:00Z")
    },
    {
      id: "customer-2",
      email: "customer2@example.com",
      role: "customer",
      onboardingComplete: true,
      createdAt: new Date("2024-02-05T00:00:00Z"),
      updatedAt: new Date("2024-02-05T00:00:00Z")
    },
    {
      id: "customer-3",
      email: "customer3@example.com",
      role: "customer",
      onboardingComplete: true,
      createdAt: new Date("2024-03-10T00:00:00Z"),
      updatedAt: new Date("2024-03-10T00:00:00Z")
    }
  ];

  const baseJobs: Job[] = [
    {
      id: "job-1",
      customerId: "customer-1",
      title: "Boiler fix",
      description: "",
      urgency: "soon",
      location: { postcode: "AB1" },
      customerContact: { name: "C1", email: "customer1@example.com", phone: "" },
      status: "completed",
      createdAt: new Date("2024-01-10T00:00:00Z"),
      updatedAt: new Date("2024-01-10T00:00:00Z"),
      tradespersonId: "owner-1"
    },
    {
      id: "job-2",
      customerId: "customer-2",
      title: "Radiator service",
      description: "",
      urgency: "flexible",
      location: { postcode: "AB1" },
      customerContact: { name: "C2", email: "customer2@example.com", phone: "" },
      status: "completed",
      createdAt: new Date("2024-02-12T00:00:00Z"),
      updatedAt: new Date("2024-02-12T00:00:00Z"),
      tradespersonId: "owner-1"
    },
    {
      id: "job-3",
      customerId: "customer-3",
      title: "Pipe repair",
      description: "",
      urgency: "urgent",
      location: { postcode: "AB1" },
      customerContact: { name: "C3", email: "customer3@example.com", phone: "" },
      status: "completed",
      createdAt: new Date("2024-03-15T00:00:00Z"),
      updatedAt: new Date("2024-03-15T00:00:00Z"),
      tradespersonId: "other-owner"
    }
  ];

  beforeEach(() => {
    jest.resetAllMocks();
    userService.getAllUsers.mockResolvedValue(baseUsers);
    jobService.getAllJobs.mockResolvedValue(baseJobs);
  });

  it("limits business owners to their own customers and jobs", async () => {
    const monthly = await analyticsService.getMonthlyMetrics({
      userScope: { role: "business_owner", userId: "owner-1" }
    });

    const totals = monthly.reduce(
      (acc, m) => {
        acc.users += m.users;
        acc.jobs += m.jobs;
        return acc;
      },
      { users: 0, jobs: 0 }
    );

    expect(monthly.map(m => m.label)).toEqual(["2024-01", "2024-02"]);
    expect(totals).toEqual({ users: 2, jobs: 2 });
  });

  it("keeps admin metrics unchanged", async () => {
    const monthly = await analyticsService.getMonthlyMetrics({});

    const totals = monthly.reduce(
      (acc, m) => {
        acc.users += m.users;
        acc.jobs += m.jobs;
        return acc;
      },
      { users: 0, jobs: 0 }
    );

    expect(monthly.map(m => m.label)).toEqual(["2024-01", "2024-02", "2024-03"]);
    expect(totals).toEqual({ users: 3, jobs: 3 });
  });
});
