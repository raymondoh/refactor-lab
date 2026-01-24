// @/components/shared/pagination/DataTable.tsx
"use client";

import {
  flexRender,
  type ColumnDef,
  type Table as TanstackTable // Renamed to avoid conflict
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "./TablePagination";

interface DataTableProps<TData, TValue> {
  table: TanstackTable<TData>; // Expect the table instance as a prop
  columns: ColumnDef<TData, TValue>[]; // Still useful for type safety and explicit column access if needed
  pageSizeOptions?: number[];
  defaultPageSize?: number; // This will now be managed by the parent's pagination state
  className?: string;
  enableSelection?: boolean; // This is now controlled by table.options.enableRowSelection
}

export function DataTable<TData, TValue>({
  table,
  columns, // Keep for potential direct use, though table instance has columns too
  pageSizeOptions = [10, 20, 30, 40, 50],
  className = ""
}: DataTableProps<TData, TValue>) {
  const enableSelection = table.options.enableRowSelection;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} data-state={enableSelection && row.getIsSelected() ? "selected" : undefined}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <TablePagination
        table={table}
        pageSizeOptions={pageSizeOptions}
        showSelection={!!enableSelection} // Pass based on table option
      />
    </div>
  );
}
