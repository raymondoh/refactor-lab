// src/app/(marketing)/search/page.tsx
import { userService } from "@/lib/services/user-service";
import { TradespersonResults } from "@/components/search/tradesperson-results";
import { Pagination } from "@/components/ui/pagination";
import { MarketingSearchForm } from "@/components/marketing/marketing-search-form";
import { Container } from "@/components/marketing/container";
import { MarketingHeader } from "@/components/layout/marketing-header";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
}

const ITEMS_PER_PAGE = 5;

export default async function SearchResultsPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() || "";
  const currentPage = Number(params.page) || 1;

  // Use the centralized tradespeople search wrapper.
  // This keeps the page thin, and lets you add Algolia → Firestore
  // fallback inside userService.searchTradespeople later if you want.
  const { users: searchResults, total } = await userService.searchTradespeople({
    query,
    page: currentPage,
    limit: ITEMS_PER_PAGE
  });

  const heading = query ? `Search results for "${query}"` : "Browse All Plumbers";
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const segments = [{ title: "Search", href: "/search" }];
  if (query) {
    segments.push({
      title: `"${query}"`,
      href: `/search?q=${encodeURIComponent(query)}`
    });
  }

  return (
    <div className="py-8 lg:py-12">
      <MarketingHeader segments={segments} />

      <section className="py-4 lg:py-12">
        <Container>
          <div className="space-y-12">
            <MarketingSearchForm initialQuery={query} />

            <div>
              <h1 className="text-3xl font-bold">{heading}</h1>
              <p className="mt-2 text-muted-foreground">{total} plumbers found.</p>
            </div>

            <TradespersonResults tradespeople={searchResults} />

            <Pagination currentPage={currentPage} totalPages={totalPages} />
          </div>
        </Container>
      </section>
    </div>
  );
}
