// src/actions/categories/admin-categories.ts
"use server";

import { requireAdmin } from "@/actions/_helpers/require-admin";
import { adminCategoryService, type FeaturedCategory } from "@/lib/services/admin-category-service";
import { fail, type ServiceResult } from "@/lib/services/service-result";
import type { CategoryData } from "@/config/categories";

function gateToFail(gate: { success: false; error: string; status?: number }): ServiceResult<never> {
  const code = gate.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN";
  return fail(code, gate.error, gate.status);
}

export async function getCategoriesAction(): Promise<ServiceResult<{ categories: CategoryData[] }>> {
  const gate = await requireAdmin();
  if (!gate.success) return gateToFail(gate);

  // choose one
  return adminCategoryService.getCategoriesWithCounts();
  // return adminCategoryService.getCategories();
}

export async function getFeaturedCategoriesAction(): Promise<
  ServiceResult<{ featuredCategories: FeaturedCategory[] }>
> {
  const gate = await requireAdmin();
  if (!gate.success) return gateToFail(gate);

  return adminCategoryService.getFeaturedCategories();
}
