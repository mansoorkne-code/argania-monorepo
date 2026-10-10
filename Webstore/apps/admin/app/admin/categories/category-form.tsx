"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@repo/ui/button";
import type {
  AdminCategory,
  CategoryFormAction,
  CategoryFormState,
} from "../../../lib/categories";
import { parentCategoryOptions } from "../../../lib/category-tree";
import styles from "./categories.module.css";

export function CategoryForm({
  action,
  categories,
  category,
}: {
  action: CategoryFormAction;
  categories: AdminCategory[];
  category?: AdminCategory;
}) {
  const [state, formAction, pending] = useActionState<
    CategoryFormState,
    FormData
  >(action, {});
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(category));
  const [parentId, setParentId] = useState(category?.parent_id ?? "");
  const [status, setStatus] = useState(category?.status ?? "draft");
  const [description, setDescription] = useState(category?.description ?? "");
  const error = (field: string) => state.fieldErrors?.[field];
  const parents = parentCategoryOptions(categories, category?.id);
  return (
    <form
      action={formAction}
      className={styles.form}
      onReset={(event) => event.preventDefault()}
    >
      {state.formError && (
        <p role="alert" className={styles.error}>
          {state.formError}
        </p>
      )}
      <div className={styles.formGrid}>
        <label className={styles.field} htmlFor="category-name">
          Name
          <input
            id="category-name"
            name="name"
            value={name}
            maxLength={180}
            required
            disabled={pending}
            aria-invalid={Boolean(error("name"))}
            aria-describedby={error("name") ? "name-error" : undefined}
            onChange={(event) => {
              const nextName = event.currentTarget.value;
              setName(nextName);
              if (!slugEdited)
                setSlug(
                  nextName
                    .normalize("NFKD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, ""),
                );
            }}
          />
          {error("name") && (
            <span id="name-error" className={styles.error}>
              {error("name")}
            </span>
          )}
        </label>
        <label className={styles.field} htmlFor="category-slug">
          URL slug
          <input
            id="category-slug"
            name="slug"
            value={slug}
            maxLength={180}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            required
            disabled={pending}
            aria-invalid={Boolean(error("slug"))}
            aria-describedby="slug-help slug-error"
            onChange={(event) => {
              setSlugEdited(true);
              setSlug(event.currentTarget.value);
            }}
          />
          <small id="slug-help">
            Unique across all categories. Use lowercase letters, numbers, and
            single hyphens.
          </small>
          <span id="slug-error" className={styles.error} aria-live="polite">
            {error("slug")}
          </span>
        </label>
        <label className={styles.field} htmlFor="category-parent">
          Parent category
          <select
            id="category-parent"
            name="parentId"
            value={parentId}
            onChange={(event) => setParentId(event.currentTarget.value)}
            disabled={pending}
            aria-invalid={Boolean(error("parentId"))}
            aria-describedby="parent-help parent-error"
          >
            <option value="">None (top-level category)</option>
            {category?.parent_id &&
              !parents.some(
                ({ category: parent }) => parent.id === category.parent_id,
              ) && (
                <option value={category.parent_id}>
                  Current archived parent — select another to restore
                </option>
              )}
            {parents.map(({ category: parent, path }) => (
              <option key={parent.id} value={parent.id}>
                {path} ({parent.status})
              </option>
            ))}
          </select>
          <small id="parent-help">
            Self and descendants are excluded. Active categories require an
            active parent.
          </small>
          <span id="parent-error" className={styles.error}>
            {error("parentId")}
          </span>
        </label>
        <label className={styles.field} htmlFor="category-status">
          Status
          <select
            id="category-status"
            name="status"
            value={status}
            onChange={(event) =>
              setStatus(event.currentTarget.value as typeof status)
            }
            disabled={pending}
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
          <small>
            Active categories appear in the storefront. Archived categories
            retain their product assignments.
          </small>
          {error("status") && (
            <span className={styles.error}>{error("status")}</span>
          )}
        </label>
      </div>
      <label className={styles.field} htmlFor="category-description">
        Description
        <textarea
          id="category-description"
          name="description"
          value={description}
          onChange={(event) => setDescription(event.currentTarget.value)}
          maxLength={5000}
          disabled={pending}
          aria-invalid={Boolean(error("description"))}
          aria-describedby={
            error("description") ? "description-error" : undefined
          }
        />
        {error("description") && (
          <span id="description-error" className={styles.error}>
            {error("description")}
          </span>
        )}
      </label>
      <div className={styles.actions}>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : category ? "Save category" : "Create category"}
        </Button>
        <Link href="/admin/categories">Cancel</Link>
      </div>
      <div aria-live="polite">{pending ? "Saving category…" : null}</div>
    </form>
  );
}
