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
jest.mock("@/lib/services/job-service", () => ({ jobService: { getJobsForSuggestions: jest.fn() } }));

import { GET } from "./route";
import { requireSession } from "@/lib/auth/require-session";
import { jobService } from "@/lib/services/job-service";

describe("search suggestions route", () => {
  const originalFetch = global.fetch;
  beforeEach(() => {
    (requireSession as jest.Mock).mockReset();
    (jobService.getJobsForSuggestions as jest.Mock).mockReset();
    global.fetch = ((url: string) => GET({ url } as any)) as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns suggestions for job titles, skills and locations", async () => {
    (requireSession as jest.Mock).mockResolvedValue({ user: { role: "tradesperson" } });
    (jobService.getJobsForSuggestions as jest.Mock).mockResolvedValue([
      { title: "Repair pipe", serviceType: "Repair", location: { postcode: "RE1" } },
      { title: "Install sink", serviceType: "Install", location: { postcode: "RE2" } },
      { title: "Fix leak", serviceType: "Repair", location: { postcode: "XY3" } }
    ]);

    const res = await fetch("http://localhost/api/jobs/search/suggestions?q=re&limit=5");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.suggestions).toEqual([
      { type: "job", value: "Repair pipe", label: "Repair pipe", count: 1 },
      { type: "skill", value: "Repair", label: "Repair", count: 2 },
      { type: "location", value: "RE1", label: "RE1", count: 1 },
      { type: "location", value: "RE2", label: "RE2", count: 1 }
    ]);
  });

  it("returns 400 for invalid query", async () => {
    (requireSession as jest.Mock).mockResolvedValue({ user: { role: "tradesperson" } });
    const res = await fetch("http://localhost/api/jobs/search/suggestions?q=a");
    expect(res.status).toBe(400);
  });

  it("returns 403 for unauthorized roles", async () => {
    (requireSession as jest.Mock).mockResolvedValue({ user: { role: "customer" } });
    const res = await fetch("http://localhost/api/jobs/search/suggestions?q=re");
    expect(res.status).toBe(403);
  });
});

