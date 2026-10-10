const imageBucket =
  process.env.NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET || "product-images";

/** Build a public Supabase Storage URL for an image from the storefront reference asset pack. */
export function getStorefrontAssetUrl(path: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return "";

  const encodedPath = path
    .replace(/^\/+/, "")
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  return `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${encodeURIComponent(imageBucket)}/${encodedPath}`;
}
