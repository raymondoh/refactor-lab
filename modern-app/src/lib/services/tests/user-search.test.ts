// src/lib/services/tests/user-search.test.ts
jest.mock("@/lib/firebase/admin", () => ({
  UsersCollection: jest.fn()
}));

// Mock the Algolia search functions from the search.ts module
jest.mock("@/lib/services/user/search", () => ({
  searchUsers: jest.fn(),
  getActiveServiceProviders: jest.fn(),
  getActiveTradespeople: jest.fn(),
  // Mock the client just in case
  searchClient: {
    initIndex: jest.fn(() => ({
      search: jest.fn()
    }))
  }
}));

import { userService } from "../user-service";
import { UsersCollection } from "@/lib/firebase/admin";
// Import the mocked functions so we can control them
import { searchUsers, getActiveServiceProviders, getActiveTradespeople } from "@/lib/services/user/search";

interface MockUser {
  id: string;
  role: string;
  status: string;
  citySlug: string;
  serviceSlugs: string[];
  searchKeywords: string[];
  isFeatured?: boolean;
}

function matchesFilter(user: MockUser, filter: any): boolean {
  if (!filter) return true;
  if (filter.operator === "AND") {
    return filter.filters.every((f: any) => matchesFilter(user, f));
  }
  if (filter.operator === "OR") {
    return filter.filters.some((f: any) => matchesFilter(user, f));
  }

  const value = (user as any)[filter.field];
  switch (filter.operator) {
    case "==":
      return value === filter.value;
    case "array-contains":
      return Array.isArray(value) && value.includes(filter.value);
    case "array-contains-any":
      return Array.isArray(value) && filter.value.some((val: any) => value.includes(val));
    default:
      return true;
  }
}

function createMockCollection(users: MockUser[]) {
  const filters: ((user: MockUser) => boolean)[] = [];
  let limitValue: number | undefined;
  const collection: any = {
    where(fieldOrFilter: any, op?: string, value?: any) {
      if (typeof op === "undefined") {
        filters.push((user: MockUser) => matchesFilter(user, fieldOrFilter));
      } else {
        filters.push((user: MockUser) => matchesFilter(user, { field: fieldOrFilter, operator: op, value }));
      }
      return collection;
    },
    limit(n: number) {
      limitValue = n;
      return collection;
    },
    async get() {
      const results = users.filter(u => filters.every(filterFn => filterFn(u)));
      const limited = typeof limitValue === "number" ? results.slice(0, limitValue) : results;
      return { docs: limited.map(r => ({ id: r.id, data: () => r })) } as any;
    }
  };
  return collection;
}

const sampleUsers: MockUser[] = [
  {
    id: "1",
    role: "tradesperson",
    status: "active",
    citySlug: "london",
    serviceSlugs: ["boiler-repair"],
    searchKeywords: ["london", "boiler", "repair", "plumber"],
    isFeatured: true
  },
  {
    id: "2",
    role: "tradesperson",
    status: "active",
    citySlug: "manchester",
    serviceSlugs: ["drain-cleaning"],
    searchKeywords: ["manchester", "drain", "cleaning", "plumber"],
    isFeatured: false
  }
];

// --- Add mock typing ---
const mockedSearchUsers = searchUsers as jest.Mock;
const mockedGetActiveServiceProviders = getActiveServiceProviders as jest.Mock;
const mockedGetActiveTradespeople = getActiveTradespeople as jest.Mock;

describe("UserService search", () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockedSearchUsers.mockClear();
    mockedGetActiveServiceProviders.mockClear();
    mockedGetActiveTradespeople.mockClear();
    (UsersCollection as jest.Mock).mockImplementation(() => createMockCollection(sampleUsers));
  });

  it("finds tradespeople by city and service", async () => {
    // --- Setup mock return value ---
    mockedSearchUsers.mockResolvedValue({
      users: [sampleUsers[0]],
      total: 1
    });

    const { users } = await userService.findTradespeopleByCityAndService({
      citySlug: "london",
      serviceSlug: "boiler-repair"
    });
    expect(users).toHaveLength(1);
    expect(users[0].id).toBe("1");
    // FIX 1: Expect defaults page: 1, limit: 12
    expect(mockedSearchUsers).toHaveBeenCalledWith({
      city: "london",
      service: "boiler-repair",
      page: 1,
      limit: 12
    });
  });

  it("handles structured search queries", async () => {
    // --- Setup mock return value ---
    mockedSearchUsers.mockResolvedValue({
      users: [sampleUsers[0]],
      total: 1
    });

    const { users } = await userService.searchTradespeople({
      query: "boiler repair in london"
    });
    expect(users).toHaveLength(1);
    expect(users[0].id).toBe("1");
    // FIX 1: Update expectation to match the single parameter object
    expect(mockedSearchUsers).toHaveBeenCalledWith({
      query: "boiler repair in london",
      page: undefined,
      limit: undefined
    });
  });

  it("falls back to keyword search", async () => {
    // --- Setup mock return value ---
    mockedSearchUsers.mockResolvedValue({
      users: [sampleUsers[1]],
      total: 1
    });

    const { users } = await userService.searchTradespeople({
      query: "manchester"
    });
    expect(users).toHaveLength(1);
    expect(users[0].id).toBe("2");
    // FIX 1: Update expectation to match the single parameter object
    expect(mockedSearchUsers).toHaveBeenCalledWith({
      query: "manchester",
      page: undefined,
      limit: undefined
    });
  });

  it("returns active tradespeople", async () => {
    mockedGetActiveTradespeople.mockResolvedValue([sampleUsers[0]]);

    const results = await userService.getActiveTradespeople();
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("1");
    expect(mockedGetActiveTradespeople).toHaveBeenCalled();
  });
});
