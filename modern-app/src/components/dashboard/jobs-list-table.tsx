"use client";

import Link from "next/link";

import type { Job } from "@/lib/types/job";
import { getStatusColor, getStatusLabel } from "@/lib/types/job";
import { formatDateGB } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface JobsListTableProps {
  jobs: Job[];
  jobDetailPathPattern?: string;
  fallbackListPath: string;
}

const sanitizePath = (path: string) => (path.endsWith("/") ? path.slice(0, -1) : path);

const formatDate = (value: Job["createdAt"]) => {
  const formatted = formatDateGB(value);
  return formatted ?? "-";
};

export function JobsListTable({ jobs, jobDetailPathPattern, fallbackListPath }: JobsListTableProps) {
  const baseListPath = sanitizePath(fallbackListPath || "");

  const resolveDetailPath = (jobId: string) => {
    if (!jobId) return "#";
    if (jobDetailPathPattern) {
      return jobDetailPathPattern.replace("{id}", jobId);
    }
    return `${baseListPath}/${jobId}`;
  };

  return (
    <div className="relative w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[200px]">Job Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date Posted</TableHead>
            <TableHead>Quotes</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map(job => {
            const jobId = ((job as unknown as { id?: string; objectID?: string })?.id ??
              (job as unknown as { id?: string; objectID?: string })?.objectID ??
              "") as string;
            const quotesReceived = job.quoteCount ?? 0;

            return (
              <TableRow key={jobId || job.title}>
                <TableCell className="font-medium">{job.title}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(job.status)}>{getStatusLabel(job.status)}</Badge>
                </TableCell>
                <TableCell>{formatDate(job.createdAt)}</TableCell>
                <TableCell>{quotesReceived}</TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="secondary" size="sm">
                    <Link href={resolveDetailPath(jobId)} aria-label={`View job: ${job.title}`}>
                      View Job
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
