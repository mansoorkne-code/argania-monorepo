import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { CategoryNode } from "./category-tree";

export type AdminCategory = CategoryNode & {
  slug: string;
  description: string | null;
  productCount: number;
  activeProductCount: number;
  image_path: string | null;
  image_alt: string | null;
};

export async function getCategoryAccess() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect("/login?next=%2Fadmin%2Fcategories");
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError || !profile || !["admin", "manager"].includes(profile.role))
    redirect("/login?error=unauthorized");
  return { supabase, role: profile.role as "admin" | "manager" };
}

export async function requireCategoryAdmin() {
  const access = await getCategoryAccess();
  if (access.role !== "admin") redirect("/admin/categories?error=forbidden");
  return access.supabase;
}

export async function getAdminCategories(
  supabase: SupabaseClient,
): Promise<AdminCategory[]> {
  const { data, error } = await supabase.rpc("admin_category_list");
  if (error) throw new Error("Unable to load categories.", { cause: error });
  return (data ?? []).map(
    (
      row: CategoryNode & {
        slug: string;
        description: string | null;
        product_count: number;
        active_product_count: number;
        image_path: string | null;
        image_alt: string | null;
      },
    ) => ({
      ...row,
      productCount: Number(row.product_count),
      activeProductCount: Number(row.active_product_count),
    }),
  );
}

export type CategoryFormState = {
  formError?: string;
  fieldErrors?: Record<string, string>;
};
export type CategoryFormAction = (
  previousState: CategoryFormState,
  formData: FormData,
) => Promise<CategoryFormState>;
