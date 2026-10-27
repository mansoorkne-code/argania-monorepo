"use server";
import { revalidatePath } from "next/cache";
import { requireCategoryAdmin } from "../../../lib/categories";
import {
  cleanupCategoryImage,
  saveCategoryImageRecord,
} from "../../../lib/category-image-service";

export async function saveCategoryImage(
  categoryId: string,
  path: string | null,
  altText: string,
  expectedPath: string | null,
) {
  const supabase = await requireCategoryAdmin();
  const result = await saveCategoryImageRecord(
    supabase,
    categoryId,
    path,
    altText,
    expectedPath,
  );
  if (result.ok) {
    revalidatePath("/admin/categories", "layout");
    revalidatePath(`/admin/categories/${categoryId}/edit`);
  }
  return result;
}
export async function retryCategoryImageCleanup(
  categoryId: string,
  path: string,
) {
  const supabase = await requireCategoryAdmin();
  return cleanupCategoryImage(supabase, categoryId, path);
}
