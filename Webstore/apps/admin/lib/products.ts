import type { SupabaseClient } from "@supabase/supabase-js";
import { getProductAccess } from "./product-access";

export const adminProductPageSize = 15;

export type ProductCategoryOption = {
  id: string;
  name: string;
  status: string;
};

export type ProductVariantRecord = {
  id: string;
  sku: string;
  name: string;
  price: number | string;
  compare_at_price: number | string | null;
  stock_quantity: number;
  weight_kg: number | string;
  is_active: boolean;
  created_at: string;
};

export type AdminProductImageRecord = {
  id: string;
  variant_id: string | null;
  storage_path: string;
  alt_text: string | null;
  position: number;
  created_at: string;
};

export type AdminProductRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  status: "draft" | "active" | "archived";
  created_at: string;
  category: { name: string } | null;
  product_variants: ProductVariantRecord[];
  product_images: AdminProductImageRecord[];
};

export async function getProductCategories(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, status")
    .order("name");
  if (error)
    throw new Error("Unable to load product categories.", { cause: error });
  return (data ?? []) as ProductCategoryOption[];
}

export async function getProducts(
  options: {
    search?: string;
    status?: "draft" | "active" | "archived";
    categoryId?: string;
    page?: number;
  },
  supabase: SupabaseClient,
) {
  let query = supabase
    .from("products")
    .select(
      "id, name, slug, description, category_id, status, created_at, category:categories(name), product_variants(id, sku, name, price, compare_at_price, stock_quantity, weight_kg, is_active, created_at)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (options.search) {
    const search = options.search.replace(/[^a-zA-Z0-9 -]/g, "");
    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }
  }
  if (options.status) query = query.eq("status", options.status);
  if (options.categoryId) query = query.eq("category_id", options.categoryId);

  const page = Math.max(1, options.page ?? 1);
  const start = (page - 1) * adminProductPageSize;
  const { data, error, count } = await query.range(
    start,
    start + adminProductPageSize - 1,
  );
  if (error) throw new Error("Unable to load products.", { cause: error });

  return {
    products: (data ?? []) as unknown as AdminProductRecord[],
    totalCount: count ?? 0,
    page,
  };
}

export async function getProductById(id: string, supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, slug, description, category_id, status, created_at, category:categories(name), product_variants(id, sku, name, price, compare_at_price, stock_quantity, weight_kg, is_active, created_at), product_images(id, variant_id, storage_path, alt_text, position, created_at)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error("Unable to load this product.", { cause: error });
  if (!data) return null;
  const product = data as unknown as AdminProductRecord;
  product.product_variants = (product.product_variants ?? []).sort(
    (left, right) => left.created_at.localeCompare(right.created_at),
  );
  product.product_images = (product.product_images ?? []).sort(
    (left, right) =>
      left.position - right.position ||
      left.created_at.localeCompare(right.created_at),
  );
  return product;
}
