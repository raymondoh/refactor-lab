import { geocodingService } from "../geocoding-service";

describe("GeocodingService caching", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (geocodingService as unknown as { cache: Map<string, unknown> }).cache.clear();
  });

  it("uses cache for repeated postcode lookups", async () => {
    const mockData = {
      status: 200,
      result: {
        postcode: "AB1 2CD",
        latitude: 51.5,
        longitude: -0.1,
        admin_district: "District",
        admin_ward: "Ward",
        country: "Country"
      }
    };

    const fetchMock = jest
      .spyOn(global, "fetch" as any)
      .mockResolvedValue({ ok: true, json: () => Promise.resolve(mockData) } as any);

    const first = await geocodingService.getCoordinatesFromPostcode("AB1 2CD");
    const second = await geocodingService.getCoordinatesFromPostcode("AB1 2CD");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });
});
