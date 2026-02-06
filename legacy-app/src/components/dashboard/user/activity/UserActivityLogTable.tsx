"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw } from "lucide-react";
import { formatDate } from "@/utils/date";
import { serializeData } from "@/utils/serializeData";

import type { ActivityLogClientProps } from "@/types/dashboard/activity";

type ActivityRow = {
  id: string;
  description: string;
  type: string;
  status: string;
  timestamp?: string | Date;
};

function asRecord(v: unknown): Record<string, unknown> {
  return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {};
}
function getStringField(obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  return typeof v === "string" ? v : "";
}
function getOptionalDateish(obj: Record<string, unknown>, key: string): string | Date | undefined {
  const v = obj[key];
  if (typeof v === "string") return v;
  if (v instanceof Date) return v;
  return undefined;
}

export function UserActivityLogTable({ activities, showFilters = true, isRefreshing = false }: ActivityLogClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);

  // Normalize the activities using serializeData to convert any Timestamps to ISO strings.
  const normalizedActivitiesUnknown = serializeData(activities) as unknown;

  // Coerce into a safe, minimal shape for UI usage (no `any`)
  const normalizedActivities: ActivityRow[] = Array.isArray(normalizedActivitiesUnknown)
    ? normalizedActivitiesUnknown
        .map(item => {
          const rec = asRecord(item);
          const id = getStringField(rec, "id");
          const description = getStringField(rec, "description");
          const type = getStringField(rec, "type");
          const status = getStringField(rec, "status");
          const timestamp = getOptionalDateish(rec, "timestamp");

          if (!id) return null;
          return { id, description, type, status, timestamp };
        })
        .filter((v): v is ActivityRow => v !== null)
    : [];

  const filteredActivities = normalizedActivities.filter(activity => {
    const lower = searchTerm.toLowerCase();

    const matchesSearch = searchTerm
      ? activity.description.toLowerCase().includes(lower) || activity.type.toLowerCase().includes(lower)
      : true;

    const matchesType = filterType ? activity.type === filterType : true;

    return matchesSearch && matchesType;
  });

  const activityTypes = Array.from(new Set(normalizedActivities.map(activity => activity.type))).filter(Boolean);

  const getBadgeVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    if (["failed", "failure"].includes(status)) return "destructive";
    if (status === "pending") return "outline";
    if (["completed", "success"].includes(status)) return "default";
    return "secondary";
  };

  return (
    <div className="space-y-4 w-full">
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search activities..."
              className="pl-8"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={filterType || ""} onValueChange={value => setFilterType(value === "all" ? null : value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {activityTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" className="sm:w-[100px]" onClick={() => setSearchTerm("")}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Reset
          </Button>
        </div>
      )}

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Activity</TableHead>
              <TableHead className="whitespace-nowrap">Type</TableHead>
              <TableHead className="whitespace-nowrap">Status</TableHead>
              <TableHead className="whitespace-nowrap">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredActivities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No activities found.
                </TableCell>
              </TableRow>
            ) : (
              filteredActivities.map(activity => (
                <TableRow key={activity.id}>
                  <TableCell className="font-medium">{activity.description}</TableCell>
                  <TableCell className="whitespace-nowrap">{activity.type.replace(/_/g, " ")}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant={getBadgeVariant(activity.status)}>{activity.status}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {activity.timestamp ? formatDate(activity.timestamp, { relative: true }) : "N/A"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
