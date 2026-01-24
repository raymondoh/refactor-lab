jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, init?: { status?: number }) => ({
      ...body,
      status: init?.status ?? 200,
      json: async () => body
    })
  }
}));

jest.mock("@/lib/auth/guards", () => ({
  requireSubscription: jest.fn()
}));

jest.mock("@/lib/services/user-service", () => ({
  userService: {
    getCustomersWhoFavorited: jest.fn()
  }
}));

// No longer mocking 'isRedirectError'

import { GET } from "./route";
import { requireSubscription } from "@/lib/auth/guards";
import { userService } from "@/lib/services/user-service";

describe("GET /api/tradesperson/favorited-by", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  beforeEach(() => {
    (requireSubscription as jest.Mock).mockReset();
    (userService.getCustomersWhoFavorited as jest.Mock).mockReset();
  });

  it("returns 403 when subscription guard rejects with forbidden tier", async () => {
    (requireSubscription as jest.Mock).mockRejectedValue(new Error("FORBIDDEN_TIER"));

    const response: any = await GET();
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toContain("Access denied");
  });

  it("returns 403 when user is not a tradesperson", async () => {
    (requireSubscription as jest.Mock).mockResolvedValue({
      session: {
        user: {
          id: "user-123",
          role: "customer"
        }
      }
    });

    const response: any = await GET();
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toContain("Access denied");
    expect(userService.getCustomersWhoFavorited).not.toHaveBeenCalled();
  });

  it("returns 200 with empty list for business tradesperson", async () => {
    (requireSubscription as jest.Mock).mockResolvedValue({
      session: {
        user: {
          id: "tp-123",
          role: "tradesperson"
        }
      }
    });
    (userService.getCustomersWhoFavorited as jest.Mock).mockResolvedValue([]);

    const response: any = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.customers).toEqual([]);
  });

  it("returns public customer data when available", async () => {
    const createdAt = new Date("2023-01-01T00:00:00Z");
    (requireSubscription as jest.Mock).mockResolvedValue({
      session: {
        user: {
          id: "tp-456",
          role: "tradesperson"
        }
      }
    });
    (userService.getCustomersWhoFavorited as jest.Mock).mockResolvedValue([
      {
        id: "customer-1",
        name: "Jane Doe",
        location: { town: "London", postcode: "SW1A" },
        createdAt,
        image: null,
        profilePicture: null
      }
    ]);

    const response: any = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.customers).toHaveLength(1);
    expect(body.customers[0]).toEqual({
      id: "customer-1",
      name: "Jane Doe",
      location: "London",
      memberSince: createdAt
    });
  });
});
