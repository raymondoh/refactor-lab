// src/lib/services/user/search.ts
import { browseIndexObjects, searchIndex } from "@/lib/algolia/client";
import { logger } from "@/lib/logger";
import type { User } from "@/lib/types/user";

// Define the Algolia hit type here so it can be exported
export type AlgoliaUserHit = User & { objectID: string };

// 🔧 Resolve the plumbers index name from env instead of hardcoding "plumbers"
const PLUMBERS_INDEX = process.env.ALGOLIA_INDEX_USERS ?? process.env.NEXT_PUBLIC_ALGOLIA_INDEX_USERS ?? "plumbers";

logger.info("Algolia: using plumbers index", { indexName: PLUMBERS_INDEX });

/**
 * Searches the plumbers Algolia index.
 * This function maps objectID to id.
 */
export async function searchUsers(params: {
  query?: string;
  city?: string;
  service?: string;
  page?: number;
  limit?: number;
}): Promise<{ users: User[]; total: number }> {
  const { query = "", city, service, page = 1, limit = 10 } = params;

  const filters: string[] = [];
  if (city) filters.push(`citySlug:"${city}"`);

  // The field in your Algolia index is 'serviceSlugs', not 'specialties'.
  if (service) filters.push(`serviceSlugs:"${service}"`);

  try {
    const response = await searchIndex<User>({
      indexName: PLUMBERS_INDEX,
      searchParams: {
        filters: filters.join(" AND "),
        page: page - 1, // Algolia pages are 0-indexed
        hitsPerPage: limit,
        query
      }
    });

    const users = response.hits.map(hit => {
      const { objectID, ...rest } = hit;
      return {
        ...rest,
        id: objectID
      };
    }) as User[];

    return {
      users,
      total: response.nbHits
    };
  } catch (error) {
    logger.error("Algolia: Failed to search users:", error);
    return { users: [], total: 0 };
  }
}

/**
 * Gets a list of active service providers.
 * Used for the sitemap.
 */
export async function getActiveServiceProviders(): Promise<User[]> {
  try {
    const results: User[] = [];
    await browseIndexObjects<User>({
      indexName: PLUMBERS_INDEX,
      query: "",
      batch: (batch: AlgoliaUserHit[]): void => {
        results.push(...batch.map(hit => ({ ...hit, id: hit.objectID })));
      }
    });
    return results;
  } catch (error) {
    logger.error("Algolia: Failed to get all service providers:", error);
    return [];
  }
}

export async function getActiveTradespeople(): Promise<User[]> {
  return getActiveServiceProviders();
}

// These functions now correctly return User[]
export async function findTradespeopleByCity(citySlug: string): Promise<User[]> {
  const { users } = await searchUsers({ city: citySlug });
  return users;
}

export async function findTradespeopleByCityAndService(citySlug: string, serviceSlug: string): Promise<User[]> {
  const { users } = await searchUsers({ city: citySlug, service: serviceSlug });
  return users;
}

export async function searchTradespeople(query: string): Promise<User[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    const { users } = await searchUsers({ query: "" });
    return users;
  }
  const { users } = await searchUsers({ query: trimmed });
  return users;
}
