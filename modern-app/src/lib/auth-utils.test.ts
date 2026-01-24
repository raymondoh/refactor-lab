// src/lib/auth-utils.test.ts
import { getDashboardRoute } from "./auth-utils";

describe("getDashboardRoute", () => {
  it("should return the admin dashboard route for admin role", () => {
    expect(getDashboardRoute("admin")).toBe("/dashboard/admin");
  });

  it("should return the tradesperson dashboard route for tradesperson role", () => {
    expect(getDashboardRoute("tradesperson")).toBe("/dashboard/tradesperson");
  });

  it("should return the business owner dashboard route for business owner role", () => {
    expect(getDashboardRoute("business_owner")).toBe("/dashboard/business-owner");
  });

  it("should return the customer dashboard route for customer role", () => {
    expect(getDashboardRoute("customer")).toBe("/dashboard/customer");
  });

  it("should return the generic dashboard route for an unknown role", () => {
    expect(getDashboardRoute("unknown-role")).toBe("/dashboard");
  });

  it("should return the generic dashboard route when no role is provided", () => {
    expect(getDashboardRoute(undefined)).toBe("/dashboard");
  });

  it("should return the generic dashboard route for an empty string role", () => {
    expect(getDashboardRoute("")).toBe("/dashboard");
  });
});
