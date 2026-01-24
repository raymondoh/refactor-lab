jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, init?: any) => ({
      ...body,
      status: init?.status ?? 200,
      json: async () => body
    })
  }
}));

import { PUT } from "@/app/api/profile/route";
import { userService } from "@/lib/services/user-service";
import { geocodingService } from "@/lib/services/geocoding-service";

jest.mock("@/lib/auth/require-session", () => ({ requireSession: jest.fn() }));
jest.mock("@/lib/services/user-service", () => ({
  userService: { updateUser: jest.fn(), getUserById: jest.fn() }
}));
jest.mock("@/lib/services/geocoding-service", () => ({
  geocodingService: { getCoordinatesFromPostcode: jest.fn() }
}));

import { requireSession } from "@/lib/auth/require-session";

describe("profile route", () => {
  beforeEach(() => {
    (requireSession as jest.Mock).mockReset();
    (userService.updateUser as jest.Mock).mockReset();
    (userService.getUserById as jest.Mock).mockReset();
    (geocodingService.getCoordinatesFromPostcode as jest.Mock).mockReset();
  });

  it("updates profile when authorized", async () => {
    (requireSession as jest.Mock).mockResolvedValue({ user: { id: "1" } });
    (userService.getUserById as jest.Mock).mockResolvedValue({ id: "1" });
    (geocodingService.getCoordinatesFromPostcode as jest.Mock).mockResolvedValue({
      coordinates: { latitude: 1, longitude: 2 }
    });
    (userService.updateUser as jest.Mock).mockResolvedValue({ id: "1" });

    const req: any = {
      json: async () => ({ firstName: "A", lastName: "B" })
    };
    const res = await PUT(req as any);

    expect(res.status).toBe(200);
    expect(userService.updateUser).toHaveBeenCalledWith(
      "1",
      expect.objectContaining({
        firstName: "A",
        lastName: "B",
        onboardingComplete: true
      })
    );
  });

  it("requires auth", async () => {
    (requireSession as jest.Mock).mockImplementation(() => {
      throw new Error("UNAUTHORIZED");
    });
    const req: any = {
      json: async () => ({ firstName: "A", lastName: "B" })
    };
    const res = await PUT(req as any);
    expect(res.status).toBe(500);
  });

  it("validates payload with zod (missing lastName => 400)", async () => {
    (requireSession as jest.Mock).mockResolvedValue({ user: { id: "1" } });
    (userService.getUserById as jest.Mock).mockResolvedValue({ id: "1" });
    const req: any = {
      json: async () => ({ firstName: "A" }) // missing lastName
    };
    const res = await PUT(req as any);
    expect(res.status).toBe(400);
  });
});
