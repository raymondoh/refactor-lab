"use client";

import { useState, useEffect } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi
} from "@/components/ui/carousel";
import { subcategories, categories, type Category } from "@/config/categories";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface SubcategoryCardsProps {
  parentCategory: string;
  selectedSubcategory: string | null;
  onSubcategorySelect: (subcategoryId: string | null) => void;
}

export function SubcategoryCards({ parentCategory, selectedSubcategory, onSubcategorySelect }: SubcategoryCardsProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  /* ── carousel scroll‑state listeners ────────────────────────── */
  useEffect(() => {
    if (!api) return;
    const sync = () => {
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    };
    api.on("select", sync);
    api.on("resize", sync);
    sync();
    return () => {
      api.off("select", sync);
      api.off("resize", sync);
    };
  }, [api]);

  /* ── derive sub‑categories from config ─────────────────────── */
  const slug = (s: string) => s.toLowerCase().replace(/\s+/g, "-");
  const parentName: Category | undefined = categories.find(c => slug(c) === slug(parentCategory)) as
    | Category
    | undefined;
  const list = parentName ? (subcategories[parentName] ?? []) : [];
  if (list.length === 0) return null;

  /* ── shared styles ─────────────────────────────────────────── */
  const baseBtn =
    "w-full h-[36px] flex items-center justify-center rounded-lg transition-all px-1.5 gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  const selectedStyles =
    "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/50 dark:bg-accent dark:text-accent-foreground dark:ring-accent/50";
  const defaultStyles = "bg-black text-white hover:opacity-90 dark:bg-white dark:text-black";
  const slideWidth = "basis-[104px]"; // narrower than top‑level category cards

  return (
    <div className="w-full mt-4 relative group">
      <Carousel setApi={setApi} className="w-full">
        <CarouselContent className="-ml-2">
          {list.map(subcat => {
            const id = slug(subcat);
            const isSelected = selectedSubcategory === id;
            return (
              <CarouselItem key={id} className={`pl-2 ${slideWidth}`} data-value={id}>
                <button
                  type="button"
                  aria-label={`Filter by ${subcat}`}
                  onClick={() => onSubcategorySelect(id)}
                  className={cn(baseBtn, isSelected ? selectedStyles : defaultStyles)}>
                  <span className="font-medium text-xs truncate">{subcat}</span>
                  {isSelected && <Check className="h-3 w-3 shrink-0" />}
                </button>
              </CarouselItem>
            );
          })}
        </CarouselContent>

        {canScrollPrev && (
          <CarouselPrevious className="absolute left-0 -translate-x-1/2 bg-background/80 backdrop-blur-sm shadow-md border-neutral-200 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 disabled:pointer-events-none" />
        )}
        {canScrollNext && (
          <CarouselNext className="absolute right-0 translate-x-1/2 bg-background/80 backdrop-blur-sm shadow-md border-neutral-200 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 disabled:pointer-events-none" />
        )}
      </Carousel>
    </div>
  );
}
