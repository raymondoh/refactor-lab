// //src/utils/category-icons.ts

// src/utils/category-icons.ts
import { CarFront as Car, Flame, Bike, Zap as Bolt, ListTree, Grid } from "lucide-react";
import type { LucideIcon } from "lucide-react";
//import { motorRacingHelmet as Helmet } from "@lucide/lab";
/**
 * Explicit mapping of *top-level* category IDs → Lucide icons.
 * If you create new top-level categories, add them here.
 */
export const categoryIcons: Record<string, LucideIcon> = {
  all: Grid, // Special “show everything” filter
  cars: Car,
  motorbikes: Flame,
  bicycles: Bike,
  evs: Bolt,
  other: ListTree
};

/** Fallback icon when a category ID isn’t in the map */
export const DefaultIcon = Bike;
