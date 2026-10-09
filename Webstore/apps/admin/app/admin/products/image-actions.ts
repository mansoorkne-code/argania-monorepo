"use server";

import { revalidatePath } from "next/cache";
import { requireProductAdmin } from "../../../lib/product-access";

const imageIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const imagePathPattern =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\/([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.(jpg|png|webp|avif)$/i;
const bucket =
  process.env.NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET || "product-images";

type ActionResult = { ok: boolean; message?: string };

function isUuid(value: string) {
  return imageIdPattern.test(value);
}

function revalidateProduct(productId: string) {
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}/edit`);
}

export async function registerProductImage(
  productId: string,
  storagePath: string,
  altText: string,
  variantId: string,
): Promise<ActionResult> {
  const supabase = await requireProductAdmin();
  const pathMatch = imagePathPattern.exec(storagePath);
  const pathProductId = pathMatch?.[1];
  if (
    !isUuid(productId) ||
    !pathProductId ||
    pathProductId.toLowerCase() !== productId.toLowerCase() ||
    altText.length > 250 ||
    (variantId !== "" && !isUuid(variantId))
  ) {
    return { ok: false, message: "Image details are invalid." };
  }

  if (variantId) {
    const { data: variant, error: variantError } = await supabase
      .from("product_variants")
      .select("id")
      .eq("id", variantId)
      .eq("product_id", productId)
      .maybeSingle();
    if (variantError || !variant) {
      await supabase.storage.from(bucket).remove([storagePath]);
      return {
        ok: false,
        message: "Choose a variant belonging to this product.",
      };
    }
  }

  const { data: lastImage, error: positionError } = await supabase
    .from("product_images")
    .select("position")
    .eq("product_id", productId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (positionError) {
    await supabase.storage.from(bucket).remove([storagePath]);
    return { ok: false, message: "Could not prepare the image record." };
  }

  const { error } = await supabase.from("product_images").insert({
    product_id: productId,
    variant_id: variantId || null,
    storage_path: storagePath,
    alt_text: altText.trim() || null,
    position: (lastImage?.position ?? -1) + 1,
  });

  if (error) {
    const { error: cleanupError } = await supabase.storage
      .from(bucket)
      .remove([storagePath]);
    if (cleanupError)
      console.error(
        "[product-images] failed-upload cleanup failed",
        cleanupError,
      );
    return {
      ok: false,
      message:
        "The image record could not be saved. The uploaded file was cleaned up where possible.",
    };
  }

  revalidateProduct(productId);
  return { ok: true };
}

export async function updateProductImage(
  productId: string,
  imageId: string,
  altText: string,
  variantId: string,
): Promise<ActionResult> {
  const supabase = await requireProductAdmin();
  if (
    !isUuid(productId) ||
    !isUuid(imageId) ||
    altText.length > 250 ||
    (variantId !== "" && !isUuid(variantId))
  ) {
    return { ok: false, message: "Image details are invalid." };
  }

  if (variantId) {
    const { data: variant, error: variantError } = await supabase
      .from("product_variants")
      .select("id")
      .eq("id", variantId)
      .eq("product_id", productId)
      .maybeSingle();
    if (variantError || !variant) {
      return {
        ok: false,
        message: "Choose a variant belonging to this product.",
      };
    }
  }

  const { data, error } = await supabase
    .from("product_images")
    .update({ alt_text: altText.trim() || null, variant_id: variantId || null })
    .eq("id", imageId)
    .eq("product_id", productId)
    .select("id")
    .maybeSingle();
  if (error || !data) {
    return { ok: false, message: "Image details could not be saved." };
  }

  revalidateProduct(productId);
  return { ok: true };
}

export async function reorderProductImages(
  productId: string,
  imageIds: string[],
): Promise<ActionResult> {
  const supabase = await requireProductAdmin();
  if (
    !isUuid(productId) ||
    imageIds.length === 0 ||
    imageIds.length > 100 ||
    imageIds.some((id) => !isUuid(id)) ||
    new Set(imageIds).size !== imageIds.length
  ) {
    return { ok: false, message: "Image order is invalid." };
  }

  const { error } = await supabase.rpc("reorder_product_images", {
    p_product_id: productId,
    p_image_ids: imageIds,
  });
  if (error) return { ok: false, message: "Image order could not be saved." };

  revalidateProduct(productId);
  return { ok: true };
}

function isMissingStorageObject(error: {
  statusCode?: string;
  message?: string;
}) {
  return error.statusCode === "404" || /not found/i.test(error.message ?? "");
}

export async function deleteProductImage(
  productId: string,
  imageId: string,
): Promise<ActionResult> {
  const supabase = await requireProductAdmin();
  if (!isUuid(productId) || !isUuid(imageId)) {
    return { ok: false, message: "Image details are invalid." };
  }

  const { data: image, error: readError } = await supabase
    .from("product_images")
    .select("storage_path")
    .eq("id", imageId)
    .eq("product_id", productId)
    .maybeSingle();
  if (readError || !image) {
    return { ok: false, message: "Image could not be found." };
  }

  const { error: storageError } = await supabase.storage
    .from(bucket)
    .remove([image.storage_path]);
  if (storageError && !isMissingStorageObject(storageError)) {
    return {
      ok: false,
      message:
        "The image file could not be deleted. Its record was kept; please retry.",
    };
  }

  const { error: rowError } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId)
    .eq("product_id", productId);
  if (rowError) {
    return {
      ok: false,
      message:
        "The file was removed, but its database record remains. Retry deletion to finish cleanup.",
    };
  }

  revalidateProduct(productId);
  return { ok: true };
}
