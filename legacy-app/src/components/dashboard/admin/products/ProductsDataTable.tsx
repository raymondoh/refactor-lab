// src/components/dashboard/admin/products/ProductsDataTable.tsx
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
  type RowSelectionState,
  type PaginationState // Import PaginationState
} from "@tanstack/react-table";

import { DataTable } from "@/components/shared/pagination/DataTable"; // Adjusted path
import { TableToolbar } from "@/components/shared/pagination/TableToolbar"; // Adjusted path
import { ProductDialog } from "./ProductDialog";
import type { Product } from "@/types/product";
// import type { Category } from "@/types/category"; // If needed for toolbar filters, etc.

interface ProductsDataTableProps {
  data: Product[];
  columns: ColumnDef<Product>[];
  onRefresh: () => void;
  // categories: Category[]; // Pass if toolbar needs them for custom filters
  // featuredCategories: Category[];
}

export function ProductsDataTable({ data, columns, onRefresh }: ProductsDataTableProps) {
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  // State for TanStack Table moved here
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    // Explicit pagination state
    pageIndex: 0,
    pageSize: 10 // Default page size
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection,
      pagination // Use the state here
    },
    enableRowSelection: false, // Example: disabled for products table
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination, // Manage pagination state
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
    getRowId: (row: Product) => row.id // Assuming Product has an 'id'
  });

  return (
    <div className="space-y-4">
      <TableToolbar
        table={table} // Pass the table instance
        searchKey="name" // Or whichever key you want for primary search
        searchPlaceholder="Search products by name..."
        onRefresh={onRefresh}
        onAdd={() => setIsAddProductOpen(true)}
        addButtonText="Add Product"
        showColumnToggle={true}
      />

      <DataTable
        table={table} // Pass the table instance
        columns={columns} // Still pass columns for header/cell rendering flexibility
        // Data is now managed by the table instance itself
      />

      <ProductDialog
        open={isAddProductOpen}
        onOpenChange={setIsAddProductOpen}
        onSuccess={() => {
          setIsAddProductOpen(false);
          onRefresh?.();
        }}
      />
    </div>
  );
}
