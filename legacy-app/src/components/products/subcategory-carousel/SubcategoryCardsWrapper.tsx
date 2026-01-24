"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SubcategoryCards } from "./SubcategoryCards";
import { useEffect, useState } from "react";

interface SubcategoryCardsWrapperProps {
  parentCategory: string | null;
}

export function SubcategoryCardsWrapper({ parentCategory }: SubcategoryCardsWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(searchParams.get("subcategory"));

  // Add debugging
  useEffect(() => {
    console.log("SubcategoryCardsWrapper - parentCategory:", parentCategory);
    console.log("SubcategoryCardsWrapper - selectedSubcategory:", selectedSubcategory);
  }, [parentCategory, selectedSubcategory]);

  // Update internal state when URL changes
  useEffect(() => {
    setSelectedSubcategory(searchParams.get("subcategory"));
  }, [searchParams]);

  // Don't render anything if no parent category is selected
  if (!parentCategory || parentCategory === "all") {
    console.log("No parent category or 'all' selected, not rendering subcategories");
    return null;
  }

  const handleSubcategorySelect = (subcategoryId: string | null) => {
    // Create a new URLSearchParams object based on the current params
    const params = new URLSearchParams(searchParams.toString());

    // Update or remove the subcategory parameter
    if (subcategoryId) {
      params.set("subcategory", subcategoryId);
    } else {
      params.delete("subcategory");
    }

    // Always keep the parent category parameter
    params.set("category", parentCategory);

    // Navigate to the new URL
    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  return (
    <SubcategoryCards
      parentCategory={parentCategory}
      selectedSubcategory={selectedSubcategory}
      onSubcategorySelect={handleSubcategorySelect}
    />
  );
}
