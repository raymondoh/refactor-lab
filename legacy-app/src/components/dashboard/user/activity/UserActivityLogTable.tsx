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

export function UserActivityLogTable({ activities, showFilters = true, isRefreshing = false }: ActivityLogClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);

  // Normalize the activities using serializeData to convert any Timestamps to ISO strings.
  const normalizedActivities = serializeData(activities);

  const filteredActivities = normalizedActivities.filter((activity: any) => {
    const matchesSearch = searchTerm
      ? activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.type.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    const matchesType = filterType ? activity.type === filterType : true;

    return matchesSearch && matchesType;
  });

  const activityTypes = Array.from(new Set(normalizedActivities.map((activity: any) => activity.type)));

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
              filteredActivities.map((activity: any) => (
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
