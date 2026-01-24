// src/lib/algolia/client.ts
import { algoliasearch } from "algoliasearch";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

const env = getEnv();

type AlgoliaClient = ReturnType<typeof algoliasearch>;

type SearchSingleIndexParams = {
  indexName: string;
  searchParams?: Record<string, unknown>;
};

type SearchSingleIndexResponse<THit> = {
  hits: (THit & { objectID: string })[];
  nbHits: number;
  nbPages: number;
  facets?: Record<string, Record<string, number>>;
};

type BrowseObjectsParams<THit> = {
  indexName: string;
  query?: string;
  browseParams?: Record<string, unknown>;
  batch: (batch: (THit & { objectID: string })[]) => void;
};

// Prefer the public app ID, but also support the older ALGOLIA_APPID
const appId = env.NEXT_PUBLIC_ALGOLIA_APP_ID ?? env.ALGOLIA_APPID;

// FIX: Try to get the Admin Key (Server), otherwise fall back to Search Key (Client)
const apiKey = env.ALGOLIA_ADMIN_API_KEY ?? env.ALGOLIA_ADMINKEY ?? env.NEXT_PUBLIC_ALGOLIA_SEARCH_ONLY_KEY;

// --- Availability check ---
// Force "unavailable" (mock mode) if APP_MODE is "mock" or keys are missing.
const isMockMode = env.NEXT_PUBLIC_APP_MODE === "mock" || process.env.NODE_ENV === "test";
const isAlgoliaAvailable = Boolean(appId && apiKey) && !isMockMode;

if (!isAlgoliaAvailable) {
  // Only log if we aren't intentionally in mock mode
  if (!isMockMode) {
    logger.warn("Algolia Client: Running in no-op mode.", {
      reason: "Missing Env Vars",
      hasAppId: !!appId,
      hasApiKey: !!apiKey // Changed from hasAdminKey to generic hasApiKey
    });
  }
}

// Define the client using a factory that returns a real client or a safe fallback
const clientFactory = (): AlgoliaClient => {
  if (isAlgoliaAvailable) {
    return algoliasearch(appId as string, apiKey as string);
  } else {
    // Return a dummy object structure to satisfy the type system without actual networking
    return {
      initIndex: () => ({
        search: async () => ({ hits: [], nbHits: 0, nbPages: 0 }),
        searchSingleIndex: async () => ({ hits: [], nbHits: 0, nbPages: 0 }),
        browseObjects: async (params: BrowseObjectsParams<unknown>) => params.batch([])
      })
    } as unknown as AlgoliaClient;
  }
};

const clientInstance = clientFactory();

// This is your "search client" – safe for client-side use if apiKey is the search key
export const searchClient: AlgoliaClient = clientInstance;

// This is your Admin client – ONLY use in server-side code.
// Warning: On the client-side, this will still be the search-only client,
// so write operations will fail (which is good security).
export const adminClient: AlgoliaClient = clientInstance;

interface ExtendedAlgoliaClient {
  searchSingleIndex<THit>(
    params: SearchSingleIndexParams,
    requestOptions?: Record<string, unknown>
  ): Promise<SearchSingleIndexResponse<THit>>;
  browseObjects<THit>(params: BrowseObjectsParams<THit>, requestOptions?: Record<string, unknown>): Promise<void>;
}

const extendedAdminClient = adminClient as unknown as ExtendedAlgoliaClient;

export function searchIndex<THit>(
  params: SearchSingleIndexParams,
  requestOptions?: Record<string, unknown>
): Promise<SearchSingleIndexResponse<THit>> {
  if (!isAlgoliaAvailable) {
    return Promise.resolve({
      hits: [],
      nbHits: 0,
      nbPages: 0
    } as SearchSingleIndexResponse<THit>);
  }

  return extendedAdminClient.searchSingleIndex<THit>(params, requestOptions);
}

export function browseIndexObjects<THit>(
  params: BrowseObjectsParams<THit>,
  requestOptions?: Record<string, unknown>
): Promise<void> {
  if (!isAlgoliaAvailable) {
    params.batch([]);
    return Promise.resolve();
  }

  return extendedAdminClient.browseObjects<THit>(params, requestOptions);
}
