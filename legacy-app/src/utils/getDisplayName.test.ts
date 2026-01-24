import { getDisplayName } from "./getDisplayName";

describe("getDisplayName", () => {
  it("returns the name when provided", () => {
    expect(getDisplayName("Alice")).toBe("Alice");
  });

  it("falls back to the email prefix", () => {
    expect(getDisplayName(undefined, "bob@example.com")).toBe("bob");
  });

  it("uses the fallbackEmail prefix when name and email are missing", () => {
    expect(getDisplayName(null, null, "carol@test.com")).toBe("carol");
  });

  it("returns 'User' when nothing is supplied", () => {
    expect(getDisplayName()).toBe("User");
  });
});
