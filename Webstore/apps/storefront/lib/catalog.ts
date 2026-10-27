import { createClient } from "./supabase/server";

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imagePath: string | null;
  imageAlt: string | null;
  imageUrl: string | null;
}

export interface CatalogVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  stockQuantity: number;
  attributes: Record<string, string>;
  priceNeedsConfirmation?: boolean;
}

export interface CatalogImage {
  url: string;
  alt: string;
}

export interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: Pick<CatalogCategory, "name" | "slug"> | null;
  variants: CatalogVariant[];
  images: CatalogImage[];
}

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: { name: string; slug: string } | null;
  product_variants: {
    id: string;
    name: string;
    sku: string;
    price: number | string;
    compare_at_price: number | string | null;
    stock_quantity: number;
    attributes: Record<string, unknown>;
    product_images: {
      storage_path: string;
      alt_text: string | null;
      position: number;
    }[];
  }[];
  product_images: {
    storage_path: string;
    alt_text: string | null;
    position: number;
  }[];
};

const imageBucket =
  process.env.NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET || "product-images";
export const catalogPageSize = 24;

export function getProductImageUrl(storagePath: string) {
  if (/^https?:\/\//i.test(storagePath)) return storagePath;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return "";

  return createStorageUrl(supabaseUrl, storagePath);
}

function createStorageUrl(supabaseUrl: string, storagePath: string) {
  const normalizedPath = storagePath.replace(/^\/+/, "");
  const encodedPath = normalizedPath
    .split("/")
    .map(encodeURIComponent)
    .join("/");
  return `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${encodeURIComponent(imageBucket)}/${encodedPath}`;
}

function mapProduct(row: ProductRow): CatalogProduct {
  const variants = (row.product_variants ?? []).map((variant) => ({
    id: variant.id,
    name: variant.name,
    sku: variant.sku,
    price: Number(variant.price),
    compareAtPrice:
      variant.compare_at_price === null
        ? null
        : Number(variant.compare_at_price),
    stockQuantity: variant.stock_quantity,
    priceNeedsConfirmation:
      Number(variant.price) === 0 &&
      typeof variant.attributes?.catalogue === "object" &&
      variant.attributes.catalogue !== null &&
      "price_confirmation_required" in variant.attributes.catalogue &&
      variant.attributes.catalogue.price_confirmation_required === true,
    attributes: Object.fromEntries(
      Object.entries(variant.attributes ?? {}).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    ),
  }));
  const imageRows = [
    ...(row.product_images ?? []),
    ...variants.flatMap((variant) => {
      const rawVariant = row.product_variants.find(
        (candidate) => candidate.id === variant.id,
      );
      return rawVariant?.product_images ?? [];
    }),
  ].sort((a, b) => a.position - b.position);
  const seenImageUrls = new Set<string>();
  const images = imageRows.flatMap((image) => {
    const url = getProductImageUrl(image.storage_path);
    if (!url || seenImageUrls.has(url)) return [];
    seenImageUrls.add(url);
    return [{ url, alt: image.alt_text || row.name }];
  });

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    category: row.category,
    variants: variants.sort((a, b) => a.price - b.price),
    images,
  };
}

const productSelect = `
  id,
  name,
  slug,
  description,
  category:categories(name, slug),
  product_variants!inner(
    id,
    name,
    sku,
    price,
    compare_at_price,
    stock_quantity,
    attributes,
    product_images(storage_path, alt_text, position)
  ),
  product_images(storage_path, alt_text, position)
`;

export async function getCatalogCategories(): Promise<CatalogCategory[]> {
  const supabase = await createClient();
  let { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_path, image_alt")
    .eq("status", "active")
    .order("name");
  // Support a rolling deployment before the category-image migration lands.
  if (error?.code === "42703") {
    const legacy = await supabase
      .from("categories")
      .select("id, name, slug, description, image_path")
      .eq("status", "active")
      .order("name");
    data =
      legacy.data?.map((category) => ({ ...category, image_alt: null })) ??
      null;
    error = legacy.error;
  }
  if (error)
    throw new Error("Unable to load catalog categories.", { cause: error });
  return (data ?? []).map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    imagePath: category.image_path,
    imageAlt: category.image_alt,
    imageUrl: category.image_path
      ? getProductImageUrl(category.image_path) || null
      : null,
  }));
}

export async function getCatalogProducts(options?: {
  categoryId?: string;
  search?: string;
  page?: number;
  availableOnly?: boolean;
}): Promise<{ products: CatalogProduct[]; totalCount: number }> {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select(productSelect, { count: "exact" })
    .eq("status", "active")
    .eq("product_variants.is_active", true)
    .order("created_at", { ascending: false });

  if (options?.categoryId) query = query.eq("category_id", options.categoryId);
  if (options?.search) query = query.ilike("name", `%${options.search}%`);
  if (options?.availableOnly)
    query = query.gt("product_variants.stock_quantity", 0);

  const page = Math.max(1, options?.page ?? 1);
  const start = (page - 1) * catalogPageSize;
  const { data, error, count } = await query.range(
    start,
    start + catalogPageSize - 1,
  );
  if (error) throw new Error("Unable to load products.", { cause: error });

  return {
    products: ((data ?? []) as unknown as ProductRow[]).map(mapProduct),
    totalCount: count ?? 0,
  };
}

export async function getCatalogProductBySlug(
  slug: string,
): Promise<CatalogProduct | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("status", "active")
    .eq("product_variants.is_active", true)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error("Unable to load this product.", { cause: error });
  return data ? mapProduct(data as unknown as ProductRow) : null;
}

export { formatPrice } from "./money";
