// src/components/search/tradesperson-results.tsx
import { TradespersonCard } from "@/components/cards/tradesperson-card";
import type { User } from "@/lib/types/user";

interface TradespersonResultsProps {
  tradespeople: User[];
}

export function TradespersonResults({ tradespeople }: TradespersonResultsProps) {
  if (tradespeople.length === 0) {
    return <p className="mt-8 text-center text-muted-foreground">No tradespeople found matching your search.</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {tradespeople.map(tp => (
        <TradespersonCard
          // --- FIX: Use tp.id, not tp.objectID ---
          key={tp.id}
          tradesperson={tp}
        />
      ))}
    </div>
  );
}
