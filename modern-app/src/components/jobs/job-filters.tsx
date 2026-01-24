"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, X, ChevronDown, Lock } from "lucide-react";
import type { FilterOptions } from "@/lib/types/job";
import SubscriptionGuard from "@/components/auth/subscription-guard";
import { clientLogger } from "@/lib/utils/logger";

interface JobFiltersProps {
  onFilterChange: (filters: Record<string, string>) => void;
}

export function JobFilters({ onFilterChange }: JobFiltersProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<FilterOptions | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});
  const [location, setLocation] = useState("");
  const [radius, setRadius] = useState("");
  const [budgetLabel, setBudgetLabel] = useState<string | null>(null);
  const [dateLabel, setDateLabel] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFilters() {
      try {
        const response = await fetch("/api/jobs/filters");
        if (response.ok) {
          const data = await response.json();
          setFilters(data.filters);
        }
      } catch (error) {
        clientLogger.error("Failed to fetch job filters:", error);
      }
    }
    fetchFilters();
  }, []);

  const handleApplyLocationFilter = () => {
    const newFilters = { ...selectedFilters };
    if (location) newFilters.location = location;
    else delete newFilters.location;

    if (radius) newFilters.radius = radius;
    else delete newFilters.radius;

    setSelectedFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSelect = (category: string, value: string) => {
    const newFilters = { ...selectedFilters, [category]: value };
    setSelectedFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    setSelectedFilters({});
    setLocation("");
    setRadius("");
    setBudgetLabel(null);
    setDateLabel(null);
    onFilterChange({ __CLEAR_ALL: "true" });
  };

  const handleBudgetSelect = (range: { label: string; min: number; max?: number }) => {
    let newFilters: Record<string, string> = { ...selectedFilters, minBudget: String(range.min) };
    if (range.max !== undefined) {
      newFilters.maxBudget = String(range.max);
    } else {
      const { maxBudget: _removed, ...rest } = newFilters;
      newFilters = rest;
    }
    setSelectedFilters(newFilters);
    setBudgetLabel(range.label);
    onFilterChange(newFilters);
  };

  const handleDateSelect = (option: { value: string; label: string }) => {
    const newFilters = { ...selectedFilters, datePosted: option.value };
    setSelectedFilters(newFilters);
    setDateLabel(option.label);
    onFilterChange(newFilters);
  };

  const toggleNoQuotes = () => {
    const newFilters = { ...selectedFilters };
    if (newFilters.noQuotes) {
      delete newFilters.noQuotes;
    } else {
      newFilters.noQuotes = "true";
    }
    setSelectedFilters(newFilters);
    onFilterChange(newFilters);
  };

  if (!filters) {
    return <div className="h-10 w-full bg-muted rounded-lg animate-pulse" />;
  }

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
      <div className="flex items-center gap-2">
        <Filter className="h-5 w-5 text-muted-foreground" />
        <span className="font-semibold text-sm">Filter by:</span>
      </div>

      {/* Location & Radius */}
      <div className="flex items-center gap-2 p-1 border rounded-md">
        <Input
          placeholder="Enter full postcode"
          className="border-none focus-visible:ring-0 focus-visible:ring-offset-0 h-8"
          value={location}
          onChange={e => setLocation(e.target.value)}
          aria-label="Location (postcode)"
        />
        <Select value={radius} onValueChange={setRadius}>
          <SelectTrigger className="w-[120px] border-none h-8" aria-label="Radius">
            <SelectValue placeholder="Radius" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5 miles</SelectItem>
            <SelectItem value="10">10 miles</SelectItem>
            <SelectItem value="20">20 miles</SelectItem>
            <SelectItem value="50">50 miles</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" onClick={handleApplyLocationFilter} disabled={!location || !radius} title="Apply location">
          Apply
        </Button>
      </div>

      {/* Urgency Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="justify-between border border-border/70">
            {selectedFilters.urgency ? `Urgency: ${selectedFilters.urgency}` : "Urgency"}
            <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandList>
              <CommandGroup>
                {filters.urgency.map(option => (
                  <CommandItem key={option.value} onSelect={() => handleSelect("urgency", option.value)}>
                    {option.label} ({option.count})
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Service Type Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="justify-between border border-border/70">
            {selectedFilters.serviceType ? `Service: ${selectedFilters.serviceType}` : "Service Type"}
            <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Filter services..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {filters.popularSkills.map(option => (
                  <CommandItem key={option.value} onSelect={() => handleSelect("serviceType", option.value)}>
                    {option.label} ({option.count})
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* --- Advanced (guarded) filters --- */}
      <SubscriptionGuard
        allowedTiers={["pro", "business"]}
        fallback={
          <Button
            variant="secondary"
            className="gap-2 border border-border/70"
            size="sm"
            onClick={() => router.push("/pricing")}
            title="Unlock more filters with Pro">
            <Lock className="h-4 w-4" />
            More filters (Pro)
          </Button>
        }>
        <div className="flex items-center gap-2">
          {/* No Quotes Yet Filter */}
          <Button
            variant={selectedFilters.noQuotes ? "primary" : "ghost"}
            className={selectedFilters.noQuotes ? "" : "border border-border/70"}
            onClick={toggleNoQuotes}>
            No Quotes Yet ({filters.noQuotesCount})
          </Button>

          {/* Budget Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="justify-between border border-border/70">
                {budgetLabel ? `Budget: ${budgetLabel}` : "Budget"}
                <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
              <Command>
                <CommandList>
                  <CommandGroup>
                    {filters.budgetRanges.map(range => (
                      <CommandItem
                        key={`${range.min}-${range.max ?? "max"}`}
                        onSelect={() => handleBudgetSelect(range)}>
                        {range.label} ({range.count})
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Date Posted Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="justify-between border border-border/70">
                {dateLabel ? `Date: ${dateLabel}` : "Date Posted"}
                <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
              <Command>
                <CommandList>
                  <CommandGroup>
                    {filters.datePosted.map(option => (
                      <CommandItem key={option.value} onSelect={() => handleDateSelect(option)}>
                        {option.label} ({option.count})
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </SubscriptionGuard>

      {/* Clear Filters Button */}
      {Object.keys(selectedFilters).length > 0 && (
        <Button variant="ghost" onClick={clearAllFilters} className="text-muted-foreground border border-border/70">
          <X className="h-4 w-4 mr-1" />
          Clear All
        </Button>
      )}
    </div>
  );
}
