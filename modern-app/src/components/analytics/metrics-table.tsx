"use client";

import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";

interface Metric {
  label: string;
  value: number | string;
}

interface MetricsTableProps {
  metrics: Metric[];
}

export function MetricsTable({ metrics }: MetricsTableProps) {
  return (
    <Table>
      <TableBody>
        {metrics.map(metric => (
          <TableRow key={metric.label}>
            <TableCell className="font-medium">{metric.label}</TableCell>
            <TableCell className="text-right">{metric.value}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

