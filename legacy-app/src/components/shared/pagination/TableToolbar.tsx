"use client";

import type React from "react";

import { Search, RefreshCw, Plus, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import type { Table } from "@tanstack/react-table";

interface TableToolbarProps<TData> {
  table: Table<TData>;
  searchKey?: string;
  searchPlaceholder?: string;
  onRefresh?: () => void;
  onAdd?: () => void;
  addButtonText?: string;
  showColumnToggle?: boolean;
  children?: React.ReactNode;
}

export function TableToolbar<TData>({
  table,
  searchKey,
  searchPlaceholder = "Search...",
  onRefresh,
  onAdd,
  addButtonText = "Add Item",
  showColumnToggle = true,
  children
}: TableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0 || table.getState().globalFilter;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex w-full items-center gap-2 sm:w-auto">
        {/* Search */}
        {searchKey && (
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
              onChange={event => table.getColumn(searchKey)?.setFilterValue(event.target.value)}
              className="w-full pl-8"
            />
          </div>
        )}

        {/* Global search fallback */}
        {!searchKey && (
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={table.getState().globalFilter ?? ""}
              onChange={event => table.setGlobalFilter(event.target.value)}
              className="w-full pl-8"
            />
          </div>
        )}

        {/* Clear filters */}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters();
              table.setGlobalFilter("");
            }}
            className="h-8 px-2 lg:px-3">
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}

        {/* Refresh button */}
        {onRefresh && (
          <Button variant="outline" size="icon" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Refresh</span>
          </Button>
        )}

        {/* Column toggle */}
        {showColumnToggle && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto hidden h-8 lg:flex">
                <Filter className="mr-2 h-4 w-4" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px]">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter(column => typeof column.accessorFn !== "undefined" && column.getCanHide())
                .map(column => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={value => column.toggleVisibility(!!value)}>
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Custom children */}
        {children}
      </div>

      {/* Add button */}
      {onAdd && (
        <Button onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          {addButtonText}
        </Button>
      )}
    </div>
  );
}
