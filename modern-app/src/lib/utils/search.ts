import type { Job } from "@/lib/types/job";
import type { SearchFilters, JobSearchResult } from "@/lib/types/search";

export class SearchUtils {
  /**
   * Filter jobs based on search criteria
   */
  static filterJobs(jobs: Job[], filters: SearchFilters): Job[] {
    return jobs.filter(job => {
      // Text search
      if (filters.query) {
        const query = filters.query.toLowerCase();
        const searchableText = [
          job.title,
          job.description,
          job.serviceType || "",
          job.location.postcode,
          job.location.address || ""
        ]
          .join(" ")
          .toLowerCase();

        if (!searchableText.includes(query)) return false;
      }

      // Location filter (basic postcode matching for now)
      if (filters.location) {
        const locationQuery = filters.location.toLowerCase();
        const jobLocation = job.location.postcode.toLowerCase();
        if (!jobLocation.includes(locationQuery)) return false;
      }

      // Urgency filter
      if (filters.urgency?.length && !filters.urgency.includes(job.urgency)) {
        return false;
      }

      // Budget filter
      if (job.budget) {
        if (filters.minBudget && job.budget < filters.minBudget) return false;
        if (filters.maxBudget && job.budget > filters.maxBudget) return false;
      }

      // Service type filter
      if (filters.serviceTypes?.length && job.serviceType) {
        if (!filters.serviceTypes.includes(job.serviceType)) return false;
      }

      // Date range filter
      if (filters.dateFrom && job.createdAt < filters.dateFrom) return false;
      if (filters.dateTo && job.createdAt > filters.dateTo) return false;

      return true;
    });
  }

  /**
   * Sort jobs based on criteria
   */
  static sortJobs(jobs: JobSearchResult[], sortBy: SearchFilters["sortBy"] = "relevance"): JobSearchResult[] {
    return [...jobs].sort((a, b) => {
      switch (sortBy) {
        case "relevance":
          return (b.relevanceScore || 0) - (a.relevanceScore || 0);

        case "urgency":
          const urgencyOrder = { emergency: 0, urgent: 1, soon: 2, flexible: 3 };
          const aUrgency = urgencyOrder[a.urgency as keyof typeof urgencyOrder];
          const bUrgency = urgencyOrder[b.urgency as keyof typeof urgencyOrder];
          if (aUrgency !== bUrgency) return aUrgency - bUrgency;
          return b.createdAt.getTime() - a.createdAt.getTime();

        case "newest":
          return b.createdAt.getTime() - a.createdAt.getTime();

        case "budget_high":
          return (b.budget || 0) - (a.budget || 0);

        case "budget_low":
          return (a.budget || 0) - (b.budget || 0);

        case "distance":
          return (a.distance || 999) - (b.distance || 999);

        default:
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });
  }

  /**
   * Generate search suggestions based on input
   */
  static generateSuggestions(query: string, jobs: Job[]): string[] {
    if (!query || query.length < 2) return [];

    const suggestions = new Set<string>();
    const queryLower = query.toLowerCase();

    jobs.forEach(job => {
      // Title suggestions
      if (job.title.toLowerCase().includes(queryLower)) {
        suggestions.add(job.title);
      }

      // Service type suggestions
      if (job.serviceType?.toLowerCase().includes(queryLower)) {
        suggestions.add(job.serviceType);
      }

      // Location suggestions
      if (job.location.postcode.toLowerCase().includes(queryLower)) {
        suggestions.add(job.location.postcode);
      }
    });

    return Array.from(suggestions).slice(0, 5);
  }

  /**
   * Paginate results
   */
  static paginateResults<T>(
    items: T[],
    page: number = 1,
    limit: number = 20
  ): {
    items: T[];
    total: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
  } {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = items.slice(startIndex, endIndex);
    const totalPages = Math.ceil(items.length / limit);

    return {
      items: paginatedItems,
      total: items.length,
      page,
      totalPages,
      hasMore: page < totalPages
    };
  }
}

/**
 * Calculate relevance score for a job based on search query and skills
 */
export function calculateRelevanceScore(job: Job, query: string, skills?: string[]): number {
  let score = 0;

  // Text relevance (50% of score)
  if (query) {
    const queryLower = query.toLowerCase();
    const queryNoSpace = queryLower.replace(/\s/g, "");
    const titleMatch = job.title.toLowerCase().includes(queryLower);
    const descMatch = job.description.toLowerCase().includes(queryLower);
    const serviceMatch = job.serviceType?.toLowerCase().includes(queryLower);
    const skillsMatch = job.skills?.some(skill => skill.toLowerCase().includes(queryLower));
    const postcode = job.location.postcode.replace(/\s/g, "").toLowerCase();
    const postcodeMatch = postcode.includes(queryNoSpace);
    const addressMatch = job.location.address?.toLowerCase().includes(queryLower);

    if (titleMatch) score += 25;
    if (descMatch) score += 15;
    if (serviceMatch) score += 10;
    if (skillsMatch) score += 10;
    if (postcodeMatch || addressMatch) score += 10;
  }

  // Skills matching (30% of score)
  if (skills && skills.length > 0 && job.skills) {
    const matchingSkills = job.skills.filter((jobSkill: string) =>
      skills.some((skill: string) => skill.toLowerCase() === jobSkill.toLowerCase())
    );
    const skillMatchRatio = matchingSkills.length / skills.length;
    score += skillMatchRatio * 30;
  }

  // Urgency bonus (10% of score)
  const urgencyBonus = { emergency: 10, urgent: 7, soon: 5, flexible: 2 };
  score += urgencyBonus[job.urgency] || 0;

  // Recency bonus (10% of score)
  const daysSincePosted = (Date.now() - job.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSincePosted < 1) score += 10;
  else if (daysSincePosted < 7) score += 5;
  else if (daysSincePosted < 30) score += 2;

  return Math.min(score, 100); // Cap at 100
}
