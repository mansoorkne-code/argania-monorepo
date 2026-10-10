"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  adminCategoryInputSchema,
  categoryIdSchema,
} from "@webstore/validations/category";
import {
  requireCategoryAdmin,
  type CategoryFormState,
} from "../../../lib/categories";

function databaseError(error: {
  code?: string;
  message: string;
}): CategoryFormState {
  if (error.code === "23505")
    return {
      fieldErrors: {
        slug: "This slug is already in use, including by an archived category.",
      },
    };
  if (error.message.includes("category_cycle"))
    return {
      fieldErrors: {
        parentId:
          "A category cannot be its own parent or a descendant's child.",
      },
    };
  if (
    error.message.includes("category_parent_unavailable") ||
    error.code === "23503"
  )
    return {
      fieldErrors: {
        parentId:
          "Choose an existing, unarchived parent. Active categories need an active parent.",
      },
    };
  if (error.message.includes("category_dependencies"))
    return {
      formError:
        "Move or archive active products and unarchived child categories first. Deletion requires removing every product and child category reference.",
    };
  if (error.message.includes("category_not_found"))
    return {
      formError: "This category no longer exists. Return to the category list.",
    };
  return {
    formError:
      "The category could not be saved. Please try again. Check that the category management migration has been applied.",
  };
}

function refreshCategories() {
  revalidatePath("/admin/categories", "layout");
  revalidatePath("/admin/products", "layout");
  revalidatePath("/admin");
}

async function saveCategory(
  id: string | null,
  formData: FormData,
): Promise<CategoryFormState> {
  const supabase = await requireCategoryAdmin();
  if (id !== null && !categoryIdSchema.safeParse(id).success)
    return { formError: "Invalid category identifier." };
  const value = (name: string) => formData.get(name) ?? "";
  const parsed = adminCategoryInputSchema.safeParse({
    name: value("name"),
    slug: value("slug"),
    description: value("description"),
    parentId: value("parentId"),
    status: value("status"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues)
      fieldErrors[String(issue.path[0])] ??= issue.message;
    return { fieldErrors };
  }
  const input = parsed.data;
  const { error } = await supabase.rpc("admin_save_category", {
    p_id: id,
    p_name: input.name,
    p_slug: input.slug,
    p_description: input.description,
    p_parent_id: input.parentId,
    p_status: input.status,
  });
  if (error) return databaseError(error);
  refreshCategories();
  redirect(`/admin/categories?notice=${id ? "updated" : "created"}`);
}

export async function createCategoryAction(
  _state: CategoryFormState,
  formData: FormData,
) {
  return saveCategory(null, formData);
}
export async function updateCategoryAction(
  id: string,
  _state: CategoryFormState,
  formData: FormData,
) {
  return saveCategory(id, formData);
}
export async function changeCategoryStatusAction(
  id: string,
  operation: "archive" | "delete",
  _state: CategoryFormState,
  _formData: FormData,
): Promise<CategoryFormState> {
  const supabase = await requireCategoryAdmin();
  if (
    !categoryIdSchema.safeParse(id).success ||
    !["archive", "delete"].includes(operation)
  )
    return { formError: "Invalid category operation." };
  const { error } = await supabase.rpc("admin_remove_category", {
    p_id: id,
    p_operation: operation,
  });
  if (error) return databaseError(error);
  refreshCategories();
  redirect(
    `/admin/categories?notice=${operation === "delete" ? "deleted" : "archived"}`,
  );
}
