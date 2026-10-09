"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabasePublicConfig } from "../../../lib/supabase/config";
import type {
  AdminProductImageRecord,
  ProductVariantRecord,
} from "../../../lib/products";
import { createClient } from "../../../lib/supabase/client";
import {
  deleteProductImage,
  registerProductImage,
  reorderProductImages,
  updateProductImage,
} from "./image-actions";
import styles from "./products.module.css";

const bucket =
  process.env.NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET || "product-images";
const maxImageSize = 10 * 1024 * 1024;
const supportedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

type PendingImage = {
  id: string;
  file: File;
  previewUrl: string;
  altText: string;
  variantId: string;
};

type ImageManagerProps = {
  productId: string;
  images: AdminProductImageRecord[];
  variants: ProductVariantRecord[];
};

function extensionFor(file: File) {
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
  };
  return extensions[file.type];
}

function readableFileName(name: string) {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .slice(0, 250);
}

function publicImageUrl(path: string) {
  const { url } = getSupabasePublicConfig();
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `${url.replace(/\/+$/, "")}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodedPath}`;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "An unexpected error occurred.";
}

async function cleanupStorageObject(
  supabase: ReturnType<typeof createClient>,
  path: string,
) {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error)
      console.error("[product-images] failed-upload cleanup failed", error);
  } catch (error) {
    console.error("[product-images] failed-upload cleanup failed", error);
  }
}

export function ImageManager({
  productId,
  images,
  variants,
}: ImageManagerProps) {
  const router = useRouter();
  const [orderedImages, setOrderedImages] = useState(images);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const pendingImagesRef = useRef(pendingImages);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [drafts, setDrafts] = useState<
    Record<string, { altText: string; variantId: string }>
  >({});

  useEffect(() => setOrderedImages(images), [images]);
  useEffect(() => {
    pendingImagesRef.current = pendingImages;
  }, [pendingImages]);
  useEffect(
    () => () =>
      pendingImagesRef.current.forEach((image) =>
        URL.revokeObjectURL(image.previewUrl),
      ),
    [],
  );

  function chooseFiles(fileList: FileList | null) {
    setMessage("");
    const selected = Array.from(fileList ?? []);
    const accepted: PendingImage[] = [];
    const rejected: string[] = [];
    for (const file of selected) {
      if (!supportedTypes.has(file.type) || !extensionFor(file)) {
        rejected.push(`${file.name}: choose a JPG, PNG, WebP, or AVIF image.`);
        continue;
      }
      if (file.size > maxImageSize) {
        rejected.push(`${file.name}: image must be 10 MB or smaller.`);
        continue;
      }
      accepted.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        altText: readableFileName(file.name),
        variantId: "",
      });
    }
    setPendingImages((current) => [...current, ...accepted]);
    setMessage(rejected.join(" "));
  }

  function updatePending(
    id: string,
    key: "altText" | "variantId",
    value: string,
  ) {
    setPendingImages((current) =>
      current.map((image) =>
        image.id === id ? { ...image, [key]: value } : image,
      ),
    );
  }

  async function uploadPending(image: PendingImage) {
    setBusyId(image.id);
    setMessage("");
    const path = `${productId}/${crypto.randomUUID()}.${extensionFor(image.file)}`;
    let supabase: ReturnType<typeof createClient> | null = null;
    let uploadSucceeded = false;
    try {
      supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, image.file, {
          cacheControl: "3600",
          contentType: image.file.type,
          upsert: false,
        });
      if (uploadError) {
        await cleanupStorageObject(supabase, path);
        setMessage(
          `Upload failed for ${image.file.name}: ${uploadError.message}`,
        );
        return;
      }
      uploadSucceeded = true;

      const result = await registerProductImage(
        productId,
        path,
        image.altText,
        image.variantId,
      );
      if (!result.ok) {
        await cleanupStorageObject(supabase, path);
        setMessage(result.message ?? "The image could not be saved.");
        return;
      }

      uploadSucceeded = false;
      URL.revokeObjectURL(image.previewUrl);
      setPendingImages((current) =>
        current.filter((item) => item.id !== image.id),
      );
      setMessage(`${image.file.name} uploaded.`);
      router.refresh();
    } catch (error) {
      if (supabase && uploadSucceeded) {
        await cleanupStorageObject(supabase, path);
      }
      setMessage(
        `Upload failed for ${image.file.name}: ${getErrorMessage(error)}`,
      );
    } finally {
      setBusyId(null);
    }
  }

  async function saveImageDetails(image: AdminProductImageRecord) {
    const draft = drafts[image.id] ?? {
      altText: image.alt_text ?? "",
      variantId: image.variant_id ?? "",
    };
    setBusyId(image.id);
    setMessage("");
    try {
      const result = await updateProductImage(
        productId,
        image.id,
        draft.altText,
        draft.variantId,
      );
      setMessage(
        result.ok
          ? "Image details saved."
          : (result.message ?? "Image details could not be saved."),
      );
      if (result.ok) router.refresh();
    } catch (error) {
      setMessage(`Image details could not be saved: ${getErrorMessage(error)}`);
    } finally {
      setBusyId(null);
    }
  }

  async function removeImage(image: AdminProductImageRecord) {
    if (!window.confirm("Delete this image permanently?")) return;
    setBusyId(image.id);
    setMessage("");
    try {
      const result = await deleteProductImage(productId, image.id);
      setMessage(
        result.ok
          ? "Image deleted."
          : (result.message ?? "Image could not be deleted."),
      );
      if (result.ok) router.refresh();
    } catch (error) {
      setMessage(`Image could not be deleted: ${getErrorMessage(error)}`);
    } finally {
      setBusyId(null);
    }
  }

  async function moveImage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= orderedImages.length || savingOrder) return;
    const next = [...orderedImages];
    const currentImage = next[index];
    const targetImage = next[target];
    if (!currentImage || !targetImage) return;
    next[index] = targetImage;
    next[target] = currentImage;
    setSavingOrder(true);
    setMessage("");
    try {
      const result = await reorderProductImages(
        productId,
        next.map((image) => image.id),
      );
      if (result.ok) {
        setOrderedImages(next);
        setMessage("Image order saved.");
        router.refresh();
      } else {
        setMessage(result.message ?? "Image order could not be saved.");
      }
    } catch (error) {
      setMessage(`Image order could not be saved: ${getErrorMessage(error)}`);
    } finally {
      setSavingOrder(false);
    }
  }

  function draftFor(image: AdminProductImageRecord) {
    return (
      drafts[image.id] ?? {
        altText: image.alt_text ?? "",
        variantId: image.variant_id ?? "",
      }
    );
  }

  return (
    <section
      aria-labelledby="product-images-title"
      className={styles.formSection}
    >
      <div className={styles.formSectionHeading}>
        <div>
          <h2 id="product-images-title">Product images</h2>
          <p>
            Images are public on the storefront. JPG, PNG, WebP, or AVIF up to
            10 MB each.
          </p>
        </div>
      </div>

      <label className={styles.imagePicker}>
        <span>Choose product images</span>
        <input
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          onChange={(event) => {
            chooseFiles(event.currentTarget.files);
            event.currentTarget.value = "";
          }}
          type="file"
        />
      </label>

      {message ? (
        <p className={styles.imageMessage} role="status">
          {message}
        </p>
      ) : null}

      {pendingImages.length ? (
        <div className={styles.imageGrid}>
          {pendingImages.map((image) => (
            <article className={styles.imageCard} key={image.id}>
              <Image
                alt={`Preview of ${image.altText || image.file.name}`}
                className={styles.imagePreview}
                height={180}
                src={image.previewUrl}
                unoptimized
                width={240}
              />
              <p className={styles.imageFileName}>{image.file.name}</p>
              <label className={styles.imageField}>
                <span>Alt text</span>
                <input
                  maxLength={250}
                  onChange={(event) =>
                    updatePending(
                      image.id,
                      "altText",
                      event.currentTarget.value,
                    )
                  }
                  value={image.altText}
                />
              </label>
              <label className={styles.imageField}>
                <span>Variant</span>
                <select
                  onChange={(event) =>
                    updatePending(
                      image.id,
                      "variantId",
                      event.currentTarget.value,
                    )
                  }
                  value={image.variantId}
                >
                  <option value="">All variants</option>
                  {variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.name} · {variant.sku}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className={styles.imageActionButton}
                disabled={busyId === image.id}
                onClick={() => void uploadPending(image)}
                type="button"
              >
                {busyId === image.id ? "Uploading…" : "Upload image"}
              </button>
            </article>
          ))}
        </div>
      ) : null}

      {orderedImages.length ? (
        <div className={styles.imageGrid}>
          {orderedImages.map((image, index) => {
            const draft = draftFor(image);
            return (
              <article className={styles.imageCard} key={image.id}>
                <Image
                  alt={draft.altText || "Product image"}
                  className={styles.imagePreview}
                  height={180}
                  src={publicImageUrl(image.storage_path)}
                  unoptimized
                  width={240}
                />
                <p className={styles.imageFileName}>Position {index + 1}</p>
                <label className={styles.imageField}>
                  <span>Alt text</span>
                  <input
                    maxLength={250}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [image.id]: {
                          ...draft,
                          altText: event.currentTarget.value,
                        },
                      }))
                    }
                    value={draft.altText}
                  />
                </label>
                <label className={styles.imageField}>
                  <span>Variant</span>
                  <select
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [image.id]: {
                          ...draft,
                          variantId: event.currentTarget.value,
                        },
                      }))
                    }
                    value={draft.variantId}
                  >
                    <option value="">All variants</option>
                    {variants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.name} · {variant.sku}
                      </option>
                    ))}
                  </select>
                </label>
                <div className={styles.imageActions}>
                  <button
                    className={styles.imageActionButton}
                    disabled={busyId === image.id}
                    onClick={() => void saveImageDetails(image)}
                    type="button"
                  >
                    Save details
                  </button>
                  <button
                    aria-label={`Move image ${index + 1} earlier`}
                    className={styles.imageActionButton}
                    disabled={index === 0 || savingOrder}
                    onClick={() => void moveImage(index, -1)}
                    type="button"
                  >
                    ↑
                  </button>
                  <button
                    aria-label={`Move image ${index + 1} later`}
                    className={styles.imageActionButton}
                    disabled={index === orderedImages.length - 1 || savingOrder}
                    onClick={() => void moveImage(index, 1)}
                    type="button"
                  >
                    ↓
                  </button>
                  <button
                    className={styles.imageDeleteButton}
                    disabled={busyId === image.id}
                    onClick={() => void removeImage(image)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {!orderedImages.length && !pendingImages.length ? (
        <p className={styles.imageEmpty}>No images added yet.</p>
      ) : null}
    </section>
  );
}
