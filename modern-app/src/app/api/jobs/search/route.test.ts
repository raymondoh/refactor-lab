jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, init?: any) => ({
      ...body,
      status: init?.status ?? 200,
      json: async () => body
    })
  }
}));

jest.mock("@/lib/auth/require-session", () => ({ requireSession: jest.fn() }));
jest.mock("@/lib/services/job-service", () => ({ jobService: { searchJobs: jest.fn() } }));
jest.mock("@/lib/services/geocoding-service", () => ({ geocodingService: { getCoordinatesFromPostcode: jest.fn() } }));

import { GET } from "./route";
import { requireSession } from "@/lib/auth/require-session";
import { jobService } from "@/lib/services/job-service";
import { geocodingService } from "@/lib/services/geocoding-service";

describe("job search route", () => {
  const originalFetch = global.fetch;
  beforeEach(() => {
    (requireSession as jest.Mock).mockReset();
    (jobService.searchJobs as jest.Mock).mockReset();
    (geocodingService.getCoordinatesFromPostcode as jest.Mock).mockReset();
    global.fetch = ((url: string) => GET({ url } as any)) as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("filters parameters and returns sorted jobs", async () => {
    (requireSession as jest.Mock).mockResolvedValue({ user: { role: "tradesperson" } });
    (geocodingService.getCoordinatesFromPostcode as jest.Mock).mockResolvedValue({
      coordinates: { latitude: 1, longitude: 2 }
    });
    const jobs = [
      {
        id: "2",
        title: "Repair sink",
        createdAt: new Date("2024-02-01"),
        updatedAt: new Date("2024-02-02"),
        scheduledDate: null,
        completedDate: null
      },
      {
        id: "1",
        title: "Fix leak",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-02"),
        scheduledDate: null,
        completedDate: null
      }
    ];
    (jobService.searchJobs as jest.Mock).mockResolvedValue({
      jobs,
      pagination: {
        page: 2,
        limit: 5,
        totalJobs: 2,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: true
      },
      filters: { hasActiveFilters: true },
      stats: { totalAvailable: 2, filtered: 2, emergencyJobs: 0, avgBudget: 0 }
    });

    // Valid serviceType from JOB_SERVICE_TYPES is "Leak Detection & Repair"
    const validServiceType = "Leak Detection & Repair";
    const encodedServiceType = encodeURIComponent(validServiceType);

    const res = await fetch(
      `http://localhost/api/jobs/search?q=leak&urgency=emergency&serviceType=${encodedServiceType}&location=LS1&radius=10&minBudget=100&maxBudget=500&noQuotes=true&datePosted=7&page=2&limit=5`
    );

    expect(res.status).toBe(200);

    expect(jobService.searchJobs).toHaveBeenCalledWith({
      query: "leak",
      urgency: "emergency",
      serviceType: validServiceType,
      skills: [validServiceType], // Logic adds serviceType to skills list
      minBudget: 100,
      maxBudget: 500,
      datePosted: 7,
      location: "1,2",
      radius: 10,
      // sortBy: "createdAt", // Removed as it wasn't in URL params (default handling applies)
      noQuotes: true,
      page: 2,
      limit: 5,
      aroundLatLng: "1,2",
      aroundRadius: 10,
      facetFilters: [["urgency:emergency"], [`serviceType:${validServiceType}`]],
      numericFilters: ["budget>=100", "budget<=500", "quoteCount=0", expect.stringContaining("createdAtTimestamp>=")]
    });

    const body = await res.json();
    expect(body.jobs.map((j: any) => j.id)).toEqual(["2", "1"]);
    expect(body.jobs[0].createdAt).toBe("2024-02-01T00:00:00.000Z");
  });

  it("returns 400 for invalid parameters", async () => {
    (requireSession as jest.Mock).mockResolvedValue({ user: { role: "tradesperson" } });
    const res = await fetch("http://localhost/api/jobs/search?radius=-5");
    expect(res.status).toBe(400);
  });

  it("denies access for unauthorized roles", async () => {
    (requireSession as jest.Mock).mockResolvedValue({ user: { role: "customer" } });
    const res = await fetch("http://localhost/api/jobs/search");
    expect(res.status).toBe(403);
  });
});
