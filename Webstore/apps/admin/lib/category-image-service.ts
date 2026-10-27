import type { SupabaseClient } from "@supabase/supabase-js";
import { categoryIdSchema } from "@webstore/validations/category";
import { categoryImageBucket, isManagedCategoryImage } from "./category-images";

export type CategoryImageResult = {
  ok: boolean;
  message: string;
  cleanupPath?: string;
};

/** Shared/reference assets are never deleted by the category editor. */
export async function cleanupCategoryImage(
  supabase: SupabaseClient,
  categoryId: string,
  path: string,
): Promise<CategoryImageResult> {
  if (
    !categoryIdSchema.safeParse(categoryId).success ||
    !isManagedCategoryImage(categoryId, path)
  ) {
    return {
      ok: false,
      message: "Only files uploaded for this category can be cleaned up.",
    };
  }
  try {
    const { data: safe, error: checkError } = await supabase.rpc(
      "admin_category_image_cleanup_allowed",
      { p_id: categoryId, p_path: path },
    );
    if (checkError || !safe)
      return {
        ok: false,
        message:
          "The file is still referenced or cleanup could not be verified.",
      };
    const { error } = await supabase.storage
      .from(categoryImageBucket)
      .remove([path]);
    if (error)
      return {
        ok: false,
        message: "File cleanup failed. Please retry.",
        cleanupPath: path,
      };
    return { ok: true, message: "Unused image file removed." };
  } catch {
    return {
      ok: false,
      message: "File cleanup failed. Please retry.",
      cleanupPath: path,
    };
  }
}

export async function saveCategoryImageRecord(
  supabase: SupabaseClient,
  categoryId: string,
  path: string | null,
  altText: string,
  expectedPath: string | null,
): Promise<CategoryImageResult> {
  if (
    !categoryIdSchema.safeParse(categoryId).success ||
    typeof altText !== "string" ||
    altText.length > 250 ||
    (expectedPath !== null &&
      (typeof expectedPath !== "string" || expectedPath.length > 2048)) ||
    (path !== null &&
      (typeof path !== "string" ||
        path.length > 2048 ||
        (path !== expectedPath && !isManagedCategoryImage(categoryId, path))))
  ) {
    return { ok: false, message: "Image details are invalid." };
  }
  let error: { code?: string; message: string } | null;
  try {
    ({ error } = await supabase.rpc("admin_set_category_image", {
      p_id: categoryId,
      p_path: path,
      p_alt_text: path ? altText.trim() : null,
      p_expected_path: expectedPath,
      p_bucket: categoryImageBucket,
    }));
  } catch {
    // The database may have committed before a connection was interrupted.
    // Do not delete the uploaded file until its association is known.
    return {
      ok: false,
      message:
        "The save result could not be confirmed. Refresh before retrying; the uploaded file was kept.",
      cleanupPath: path ?? undefined,
    };
  }
  if (error) {
    let cleanupPath: string | undefined;
    const knownFailure = ["23514", "23505", "23503", "P0002", "42501"].includes(
      error.code ?? "",
    );
    if (knownFailure && path && path !== expectedPath) {
      const cleanup = await cleanupCategoryImage(supabase, categoryId, path);
      if (!cleanup.ok) cleanupPath = path;
    }
    const message = error.message.includes("category_image_conflict")
      ? "This category image changed in another session. Refresh before trying again."
      : error.message.includes("category_image_missing")
        ? "The uploaded image could not be verified. Choose a supported image and upload it again."
        : error.message.includes("category_not_found")
          ? "This category no longer exists."
          : "The image could not be saved. Check that the category image migration is applied, then refresh and retry.";
    return {
      ok: false,
      message,
      cleanupPath:
        cleanupPath ??
        (!knownFailure && path !== expectedPath
          ? (path ?? undefined)
          : undefined),
    };
  }
  if (
    expectedPath &&
    path !== expectedPath &&
    isManagedCategoryImage(categoryId, expectedPath)
  ) {
    const cleanup = await cleanupCategoryImage(
      supabase,
      categoryId,
      expectedPath,
    );
    if (!cleanup.ok)
      return {
        ok: true,
        message:
          "Image changes saved. The previous file could not be cleaned up; retry cleanup below.",
        cleanupPath: expectedPath,
      };
  }
  return {
    ok: true,
    message: path ? "Category image saved." : "Category image removed.",
  };
}
