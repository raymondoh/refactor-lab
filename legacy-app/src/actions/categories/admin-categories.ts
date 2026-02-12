// src/actions/categories/admin-categories.ts
"use server";

import { adminCategoryService } from "@/lib/services/admin-category-service";
import { requireAdmin } from "@/actions/_helpers/require-admin";

export async function getCategoriesAction() {
  // If you truly want *public-safe* categories here, no gate needed.
  // But since this is an admin page, keep it consistent and gate anyway.
  const gate = await requireAdmin();
  if (!gate.success) return gate;

  return adminCategoryService.getCategories();
}

export async function getFeaturedCategoriesAction() {
  const gate = await requireAdmin();
  if (!gate.success) return gate;

  return adminCategoryService.getFeaturedCategories();
}
