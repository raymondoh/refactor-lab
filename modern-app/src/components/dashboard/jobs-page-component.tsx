"use client";

import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Session } from "next-auth";
import type { Job, SearchResult } from "@/lib/types/job";
import type { UserRole } from "@/lib/auth/roles";
import { canAccess } from "@/lib/auth/roles";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { JobFilters } from "@/components/jobs/job-filters";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import { Pagination } from "@/components/ui/pagination";
import { Briefcase, AlertCircle, Eye, Search, RotateCcw } from "lucide-react";
import { useDebouncedValue } from "@/hooks/use-debounce-search";
import { JobCard } from "@/components/cards/job-card";
import { JobsListTable } from "@/components/dashboard/jobs-list-table";
import { Card, CardContent } from "@/components/ui/card";

interface JobsPageComponentProps {
  session: Session | null;
  pageTitle: string;
  pageDescription: string;
  allowedRoles: readonly UserRole[];
  apiEndpoint: string;
  showSaveButton?: boolean;
  listPath?: string;
  jobDetailPathPattern?: string; // e.g. "/dashboard/tradesperson/job-board/{id}"
  headerActions?: ReactNode;
  viewMode?: "card" | "table";
  showSearch?: boolean;
  showFilters?: boolean;
}

type JobFilterValues = {
  [key: string]: string | boolean | undefined;
  __CLEAR_ALL?: boolean;
};

const DEBOUNCE_MS = 450;

export function JobsPageComponent({
  session,
  pageTitle,
  pageDescription,
  allowedRoles,
  apiEndpoint,
  showSaveButton = false,
  listPath = "/dashboard/tradesperson/job-board",
  jobDetailPathPattern,
  headerActions,
  viewMode = "card",
  showSearch = true,
  showFilters = true
}: JobsPageComponentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [pagination, setPagination] = useState<SearchResult["pagination"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");

  const { debounced, flush } = useDebouncedValue(searchTerm, DEBOUNCE_MS);

  const abortRef = useRef<AbortController | null>(null);

  const effectiveTier = session?.user?.subscriptionTier ?? "basic";
  const normalizedListPath = listPath.endsWith("/") ? listPath.slice(0, -1) : listPath;

  const queryString = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debounced) params.set("q", debounced);
    else params.delete("q");
    return params.toString();
  }, [searchParams, debounced]);

  useEffect(() => {
    const role = session?.user?.role as UserRole | undefined;

    if (!session || !canAccess(role, allowedRoles)) {
      router.push("/login");
      return;
    }

    const controller = new AbortController();

    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = controller;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setPagination(null);

      try {
        const url = queryString ? `${apiEndpoint}?${queryString}` : apiEndpoint;
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`Failed to fetch jobs. (${response.status})`);
        }

        const data = await response.json();
        console.log("job-board", data);

        setJobs(data.jobs || []);
        setPagination(data.pagination ?? null);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        setError(err instanceof Error ? err.message : "An unknown error occurred.");
        setPagination(null);
      } finally {
        if (abortRef.current === controller) {
          setIsLoading(false);
          abortRef.current = null;
        }
      }
    };

    fetchData();

    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [session, allowedRoles, apiEndpoint, queryString, router]);

  const buildListUrl = (params: URLSearchParams) => {
    const query = params.toString();
    return query ? `${listPath}?${query}` : listPath;
  };

  const handleFilterChange = (newFilters: JobFilterValues) => {
    if (newFilters.__CLEAR_ALL) {
      setSearchTerm("");
      router.replace(buildListUrl(new URLSearchParams()));
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newFilters).forEach(([key, raw]) => {
      if (key === "__CLEAR_ALL") return;

      const value = typeof raw === "string" ? raw : "";

      if (value) params.set(key, value);
      else params.delete(key);
    });

    if (searchTerm) params.set("q", searchTerm);
    else params.delete("q");

    params.set("page", "1");
    router.replace(buildListUrl(params));
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    flush();

    const params = new URLSearchParams(searchParams.toString());

    if (searchTerm) params.set("q", searchTerm);
    else params.delete("q");

    params.set("page", "1");
    router.replace(buildListUrl(params));
  };

  const resolveJobId = (job: Job) =>
    ((job as unknown as { id?: string; objectID?: string })?.id ??
      (job as unknown as { id?: string; objectID?: string })?.objectID ??
      "") as string;

  const getJobDetailPath = (jobId: string) => {
    if (!jobId) return "#";
    if (jobDetailPathPattern) {
      return jobDetailPathPattern.replace("{id}", jobId);
    }
    return `${normalizedListPath}/${jobId}`;
  };

  const renderLoadingState = () => {
    if (viewMode === "table") {
      return (
        <div className="rounded-lg border divide-y">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="grid grid-cols-[2fr_repeat(3,_1fr)_auto] gap-4 p-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-8 w-24 justify-self-end" />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  };

  const renderJobsList = () => {
    if (viewMode === "table") {
      return (
        <div className="rounded-lg border">
          <JobsListTable
            jobs={jobs}
            jobDetailPathPattern={jobDetailPathPattern}
            fallbackListPath={normalizedListPath}
          />
        </div>
      );
    }
    console.log(
      "HERE Customer jobs on page:",
      jobs.map(j => ({ id: j.id, title: j.title }))
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {jobs.map(job => {
          const jobId = resolveJobId(job);
          const detailPath = getJobDetailPath(jobId);

          return (
            <JobCard
              key={jobId}
              job={job}
              showDescription={false}
              descriptionLines={3}
              showNewBadge
              footerRight={
                <div className="flex items-center gap-2">
                  {showSaveButton && (
                    <SaveJobButton
                      jobId={jobId}
                      tierOverride={effectiveTier as "basic" | "pro" | "business"}
                      variant="outline"
                      size="sm"
                    />
                  )}
                  <Button asChild size="sm">
                    <Link href={detailPath} aria-label={`View job: ${job.title}`}>
                      <Eye className="mr-2 h-4 w-4" /> View Job
                    </Link>
                  </Button>
                </div>
              }
            />
          );
        })}
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return renderLoadingState();
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center text-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h3 className="mt-4 text-lg font-medium">Something went wrong</h3>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            <RotateCcw className="mr-2 h-4 w-4" /> Try Again
          </Button>
        </div>
      );
    }

    if (jobs.length === 0) {
      return (
        <Card className="py-16 text-center">
          <CardContent className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold">No jobs found</h3>
            <p className="text-muted-foreground">
              There are currently no jobs matching your criteria. Try adjusting your search or filters.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        {renderJobsList()}

        {pagination && pagination.totalPages > 1 ? (
          <div className="mt-8">
            <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} />
          </div>
        ) : null}
      </>
    );
  };

  return (
    <div className="space-y-6">
      <DashboardHeader title={pageTitle} description={pageDescription} actions={headerActions} />

      {showSearch ? (
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <Input
            type="search"
            placeholder="Search by keyword or city (e.g., 'boiler', 'london')"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-grow"
          />
          <Button type="submit">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </form>
      ) : null}

      {showFilters ? <JobFilters onFilterChange={handleFilterChange} /> : null}

      {renderContent()}
    </div>
  );
}
