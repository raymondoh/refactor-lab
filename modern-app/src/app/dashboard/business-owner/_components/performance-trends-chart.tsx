"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type TrendDatum = {
  label: string;
  revenue: number;
  newCustomers: number;
};

interface PerformanceTrendsChartProps {
  data: TrendDatum[];
}

export function PerformanceTrendsChart({ data }: PerformanceTrendsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-md border text-sm text-muted-foreground">
        No historical data yet.
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))"
            }}
            formatter={(value, name) => {
              const safeNumber = typeof value === "number" ? value : Number(value ?? 0);

              if (name === "revenue") {
                return [
                  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(safeNumber),
                  "Revenue"
                ] as const;
              }

              return [safeNumber, "New customers"] as const;
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
          />

          <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="#2563eb33" strokeWidth={2} name="Revenue" />
          <Area
            type="monotone"
            dataKey="newCustomers"
            stroke="#10b981"
            fill="#10b98133"
            strokeWidth={2}
            name="New customers"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
