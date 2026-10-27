export const categoryImageBucket =
  process.env.NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET || "product-images";
export const maxCategoryImageSize = 10 * 1024 * 1024;
export const categoryImageTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export function categoryImageFileError(file: {
  type: string;
  size: number;
}): string | null {
  if (!Object.hasOwn(categoryImageTypes, file.type))
    return "Choose a JPG, PNG, WebP, or AVIF image.";
  if (file.size <= 0 || file.size > maxCategoryImageSize)
    return "Images must be non-empty and 10 MB or smaller.";
  return null;
}

export function isManagedCategoryImage(categoryId: string, path: string) {
  const uuid =
    "[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
  return (
    new RegExp(`^categories/(${uuid})/${uuid}\\.(jpg|png|webp|avif)$`, "i")
      .exec(path)?.[1]
      ?.toLowerCase() === categoryId.toLowerCase()
  );
}

export function categoryImageUrl(baseUrl: string, path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const encoded = path
    .replace(/^\/+/, "")
    .split("/")
    .map(encodeURIComponent)
    .join("/");
  return `${baseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${encodeURIComponent(categoryImageBucket)}/${encoded}`;
}
