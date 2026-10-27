"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/button";
import { createClient } from "../../../lib/supabase/client";
import { getSupabasePublicConfig } from "../../../lib/supabase/config";
import {
  categoryImageBucket,
  categoryImageFileError,
  categoryImageTypes,
  categoryImageUrl,
} from "../../../lib/category-images";
import { saveCategoryImage, retryCategoryImageCleanup } from "./image-actions";
import type { AdminCategory } from "../../../lib/categories";
import type { CategoryImageResult } from "../../../lib/category-image-service";
import styles from "./categories.module.css";

type Selection = { file: File; preview: string };
export function CategoryImageManager({
  category,
}: {
  category: AdminCategory;
}) {
  const router = useRouter();
  const [selection, setSelection] = useState<Selection | null>(null);
  const [altText, setAltText] = useState(category.image_alt ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [cleanupPaths, setCleanupPaths] = useState<string[]>([]);
  useEffect(
    () => () => {
      if (selection) URL.revokeObjectURL(selection.preview);
    },
    [selection],
  );

  function showResult(result: CategoryImageResult) {
    setMessage(result.message);
    setFailed(!result.ok);
    if (result.cleanupPath) {
      const path = result.cleanupPath;
      setCleanupPaths((current) => [...new Set([...current, path])]);
    }
    if (result.ok) router.refresh();
  }
  function chooseFile(file: File | undefined) {
    if (!file) return;
    const error = categoryImageFileError(file);
    if (error) {
      setMessage(error);
      setFailed(true);
      return;
    }
    setSelection({ file, preview: URL.createObjectURL(file) });
    if (!category.image_path)
      setAltText(
        file.name
          .replace(/\.[^.]+$/, "")
          .replace(/[-_]+/g, " ")
          .slice(0, 250),
      );
    setMessage("");
    setFailed(false);
  }
  async function upload() {
    if (!selection || busy) return;
    setBusy(true);
    setMessage("");
    const path = `categories/${category.id}/${crypto.randomUUID()}.${categoryImageTypes[selection.file.type]}`;
    let uploadAttempted = false;
    try {
      const supabase = createClient();
      uploadAttempted = true;
      const { error } = await supabase.storage
        .from(categoryImageBucket)
        .upload(path, selection.file, {
          cacheControl: "3600",
          contentType: selection.file.type,
          upsert: false,
        });
      if (error) {
        // A failed response can arrive after Storage accepted the object.
        setCleanupPaths((current) => [...new Set([...current, path])]);
        setFailed(true);
        setMessage(
          "Upload failed. Your current category image was kept. Please retry.",
        );
        return;
      }
      const result = await saveCategoryImage(
        category.id,
        path,
        altText,
        category.image_path,
      );
      showResult(result);
      if (result.ok) setSelection(null);
    } catch {
      setFailed(true);
      setMessage(
        "The upload or save result could not be confirmed. Refresh the preview before retrying.",
      );
      if (uploadAttempted)
        setCleanupPaths((current) => [...new Set([...current, path])]);
    } finally {
      setBusy(false);
    }
  }
  async function saveDetails() {
    if (!category.image_path || busy) return;
    setBusy(true);
    try {
      showResult(
        await saveCategoryImage(
          category.id,
          category.image_path,
          altText,
          category.image_path,
        ),
      );
    } catch {
      setFailed(true);
      setMessage("Image details could not be saved. Refresh and retry.");
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (
      !category.image_path ||
      busy ||
      !window.confirm(
        "Remove this category image? Uploaded files will be deleted where possible. Shared reference assets are kept.",
      )
    )
      return;
    setBusy(true);
    try {
      const result = await saveCategoryImage(
        category.id,
        null,
        "",
        category.image_path,
      );
      showResult(result);
      if (result.ok) {
        setSelection(null);
        setAltText("");
      }
    } catch {
      setFailed(true);
      setMessage(
        "The removal result could not be confirmed. Refresh before retrying.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function cleanup(path: string) {
    if (busy) return;
    setBusy(true);
    try {
      const result = await retryCategoryImageCleanup(category.id, path);
      showResult(result);
      if (result.ok)
        setCleanupPaths((current) => current.filter((item) => item !== path));
    } catch {
      setFailed(true);
      setMessage("File cleanup failed. Please retry.");
    } finally {
      setBusy(false);
    }
  }
  const currentImage = category.image_path
    ? categoryImageUrl(getSupabasePublicConfig().url, category.image_path)
    : null;
  return (
    <section aria-labelledby="category-image-title" className={styles.form}>
      <div>
        <h2 id="category-image-title">Category image</h2>
        <p>
          One cover image for the storefront. JPG, PNG, WebP, or AVIF up to 10
          MB.
        </p>
      </div>
      <div className={styles.imageLayout}>
        <div>
          {currentImage ? (
            <Image
              alt={category.image_alt || category.name}
              src={currentImage}
              width={320}
              height={220}
              unoptimized
              className={styles.imagePreview}
            />
          ) : (
            <p className={styles.imageEmpty}>No category image yet.</p>
          )}
          <small>Current image</small>
        </div>
        {selection && (
          <div>
            <Image
              alt={`Preview: ${altText || selection.file.name}`}
              src={selection.preview}
              width={320}
              height={220}
              unoptimized
              className={styles.imagePreview}
            />
            <small>
              {selection.file.name} ·{" "}
              {(selection.file.size / 1024 / 1024).toFixed(2)} MB
            </small>
          </div>
        )}
      </div>
      <label className={styles.field} htmlFor="category-image-file">
        {category.image_path
          ? "Choose replacement image"
          : "Choose category image"}
        <input
          id="category-image-file"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          disabled={busy}
          onChange={(event) => {
            chooseFile(event.currentTarget.files?.[0]);
            event.currentTarget.value = "";
          }}
        />
      </label>
      <label className={styles.field} htmlFor="category-image-alt">
        Image alt text
        <input
          id="category-image-alt"
          value={altText}
          maxLength={250}
          disabled={busy}
          onChange={(event) => setAltText(event.currentTarget.value)}
        />
        <small>Describe the image for screen reader users.</small>
      </label>
      {message && (
        <p
          className={failed ? styles.error : styles.notice}
          role={failed ? "alert" : "status"}
        >
          {message}
        </p>
      )}
      <div className={styles.actions}>
        {selection && (
          <>
            <Button disabled={busy} onClick={() => void upload()}>
              {busy
                ? "Working…"
                : category.image_path
                  ? "Upload replacement"
                  : "Upload image"}
            </Button>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => setSelection(null)}
            >
              Discard selection
            </Button>
          </>
        )}
        {category.image_path && (
          <>
            <Button
              variant="outline"
              disabled={busy || Boolean(selection)}
              onClick={() => void saveDetails()}
            >
              Save alt text
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => void remove()}
            >
              Remove image
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          disabled={busy}
          onClick={() => router.refresh()}
        >
          Refresh preview
        </Button>
      </div>
      {cleanupPaths.map((path, index) => (
        <div key={path} className={styles.actions}>
          <small>An unused uploaded file needs cleanup.</small>
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => void cleanup(path)}
          >
            Retry file cleanup{cleanupPaths.length > 1 ? ` ${index + 1}` : ""}
          </Button>
        </div>
      ))}
    </section>
  );
}
