// src/components/dashboard/admin/users/UsersDataTable.tsx
"use client";

import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type PaginationState
  //type Row // Added Row type for getRowClass
} from "@tanstack/react-table";

import { DataTable } from "@/components/shared/pagination/DataTable"; // Path to your shared DataTable
import { TableToolbar } from "@/components/shared/pagination/TableToolbar"; // Path to your shared TableToolbar
import { UserDialog } from "./UserDialog"; // For adding a new user
import type { SerializedUser } from "@/types/user/common";
//import { getUserRowClass } from "./users-columns"; // Import for row styling

interface UsersDataTableProps {
  data: SerializedUser[];
  columns: ColumnDef<SerializedUser>[];
  onRefresh?: () => void; // For the global refresh button in the toolbar
  // isLoading?: boolean; // If you want to pass loading state to the toolbar
}

// Suggestion: Modify your shared DataTable.tsx to accept getRowClass prop
// interface DataTableProps<TData, TValue> {
//   // ... other props
//   getRowClass?: (row: Row<TData>) => string;
// }
// And in DataTable.tsx, in the TableBody map:
// <TableRow
//   key={row.id}
//   data-state={enableSelection && row.getIsSelected() ? "selected" : undefined}
//   className={getRowClass ? getRowClass(row) : undefined} // Apply the class here
// >

export function UsersDataTable({ data, columns, onRefresh }: UsersDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10
  });
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      pagination
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
    getRowId: (row: SerializedUser) => row.id
  });

  const handleAddUserSuccess = () => {
    setIsAddUserOpen(false);
    onRefresh?.(); // Refresh data after adding a user
  };

  return (
    <div className="space-y-4">
      <TableToolbar
        table={table}
        searchPlaceholder="Search users (name, email)..."
        onRefresh={onRefresh}
        onAdd={() => setIsAddUserOpen(true)} // Trigger for Add User dialog
        addButtonText="Add User"
        showColumnToggle={true}
      />

      <DataTable
        table={table}
        columns={columns}
        // To implement getUserRowClass, you would modify DataTable.tsx as commented above
        // and then pass it here:
        // getRowClass={(row) => getUserRowClass(row.original as SerializedUser)}
      />

      <UserDialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen} onSuccess={handleAddUserSuccess} />
    </div>
  );
}
