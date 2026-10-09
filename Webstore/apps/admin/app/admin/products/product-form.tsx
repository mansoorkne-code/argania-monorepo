"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@repo/ui/button";
import type {
  ProductCategoryOption,
  ProductVariantRecord,
} from "../../../lib/products";
import type {
  ProductFormAction,
  ProductFormState,
} from "../../../lib/product-form-state";
import styles from "./products.module.css";

type ProductFormModel = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  categoryId: string | null;
  status: "draft" | "active" | "archived";
  primaryVariant: ProductVariantRecord | null;
  variantCount: number;
};

type ProductFormProps = {
  action: ProductFormAction;
  categories: ProductCategoryOption[];
  product?: ProductFormModel;
};

function toSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function FieldError({ children }: { children?: string }) {
  return children ? (
    <span className={styles.fieldError}>{children}</span>
  ) : null;
}

export function ProductForm({ action, categories, product }: ProductFormProps) {
  const [state, formAction, pending] = useActionState<
    ProductFormState,
    FormData
  >(action, {});
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(product));
  const variant = product?.primaryVariant;
  const editing = Boolean(product);
  const statusValue =
    product?.status === "archived" ? "draft" : (product?.status ?? "draft");

  const error = (field: string) => state.fieldErrors?.[field];

  return (
    <form action={formAction} className={styles.productForm}>
      {state.formError ? (
        <p className={styles.formError} role="alert">
          {state.formError}
        </p>
      ) : null}

      <section
        aria-labelledby="product-details-title"
        className={styles.formSection}
      >
        <div className={styles.formSectionHeading}>
          <div>
            <h2 id="product-details-title">Product details</h2>
            <p>Name, URL, category, and storefront status.</p>
          </div>
        </div>
        {product?.status === "archived" ? (
          <p className={styles.notice}>
            This product is archived. Saving it will restore it as a draft or
            active product.
          </p>
        ) : null}
        <div className={styles.formGrid}>
          <label className={styles.field} htmlFor="product-name">
            <span>
              Product name <b>*</b>
            </span>
            <input
              autoComplete="off"
              id="product-name"
              maxLength={180}
              name="name"
              onChange={(event) => {
                const nextName = event.currentTarget.value;
                setName(nextName);
                if (!slugEdited) setSlug(toSlug(nextName));
              }}
              required
              value={name}
            />
            <FieldError>{error("name")}</FieldError>
          </label>

          <label className={styles.field} htmlFor="product-slug">
            <span>
              URL slug <b>*</b>
            </span>
            <div className={styles.slugInput}>
              <span>/products/</span>
              <input
                autoCapitalize="none"
                autoComplete="off"
                id="product-slug"
                maxLength={180}
                name="slug"
                onChange={(event) => {
                  setSlugEdited(true);
                  setSlug(event.currentTarget.value);
                }}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                required
                spellCheck={false}
                value={slug}
              />
            </div>
            <FieldError>{error("slug")}</FieldError>
          </label>

          <label
            className={`${styles.field} ${styles.fieldWide}`}
            htmlFor="product-description"
          >
            <span>Description</span>
            <textarea
              id="product-description"
              maxLength={5_000}
              name="description"
              rows={4}
              defaultValue={product?.description ?? ""}
            />
            <FieldError>{error("description")}</FieldError>
          </label>

          <label className={styles.field} htmlFor="product-category">
            <span>Category</span>
            <select
              defaultValue={product?.categoryId ?? ""}
              id="product-category"
              name="categoryId"
            >
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {category.status !== "active" ? ` (${category.status})` : ""}
                </option>
              ))}
            </select>
            <FieldError>{error("categoryId")}</FieldError>
          </label>

          <label className={styles.field} htmlFor="product-status">
            <span>Status</span>
            <select
              defaultValue={statusValue}
              id="product-status"
              name="status"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
            </select>
            <FieldError>{error("status")}</FieldError>
          </label>
        </div>
      </section>

      <section aria-labelledby="variant-title" className={styles.formSection}>
        <div className={styles.formSectionHeading}>
          <div>
            <h2 id="variant-title">Default variant</h2>
            <p>
              Price and stock are stored on the product variant.
              {product && product.variantCount > 1
                ? ` This edits one of ${product.variantCount} variants; the others are preserved.`
                : ""}
            </p>
          </div>
        </div>
        <input
          name="primaryVariantId"
          type="hidden"
          value={variant?.id ?? ""}
        />
        <div className={styles.formGrid}>
          <label className={styles.field} htmlFor="variant-name">
            <span>
              Variant name <b>*</b>
            </span>
            <input
              id="variant-name"
              maxLength={120}
              name="variantName"
              required
              defaultValue={variant?.name ?? "Standard"}
            />
            <FieldError>{error("variantName")}</FieldError>
          </label>

          <label className={styles.field} htmlFor="variant-sku">
            <span>
              SKU <b>*</b>
            </span>
            <input
              autoCapitalize="characters"
              id="variant-sku"
              maxLength={64}
              name="sku"
              required
              defaultValue={variant?.sku ?? ""}
            />
            <FieldError>{error("sku")}</FieldError>
          </label>

          <label className={styles.field} htmlFor="variant-price">
            <span>
              Price (INR) <b>*</b>
            </span>
            <input
              id="variant-price"
              inputMode="decimal"
              name="price"
              pattern="[0-9]+([.][0-9]{1,2})?"
              placeholder="0.00"
              required
              defaultValue={variant ? Number(variant.price).toFixed(2) : ""}
            />
            <FieldError>{error("price")}</FieldError>
          </label>

          <label className={styles.field} htmlFor="variant-compare-price">
            <span>Compare-at price (INR)</span>
            <input
              id="variant-compare-price"
              inputMode="decimal"
              name="compareAtPrice"
              pattern="[0-9]+([.][0-9]{1,2})?"
              placeholder="Optional"
              defaultValue={
                variant?.compare_at_price === null || !variant
                  ? ""
                  : Number(variant.compare_at_price).toFixed(2)
              }
            />
            <FieldError>{error("compareAtPrice")}</FieldError>
          </label>

          <label className={styles.field} htmlFor="variant-stock">
            <span>
              Stock quantity <b>*</b>
            </span>
            <input
              id="variant-stock"
              min={0}
              name="stockQuantity"
              required
              step={1}
              type="number"
              defaultValue={variant?.stock_quantity ?? 0}
            />
            <FieldError>{error("stockQuantity")}</FieldError>
          </label>

          <label className={styles.field} htmlFor="variant-weight">
            <span>
              Packed weight (kg) <b>*</b>
            </span>
            <input
              id="variant-weight"
              min="0.001"
              name="weightKg"
              required
              step="0.001"
              type="number"
              defaultValue={
                variant ? Number(variant.weight_kg).toFixed(3) : "0.500"
              }
            />
            <FieldError>{error("weightKg")}</FieldError>
          </label>

          <label className={styles.field} htmlFor="variant-active">
            <span>Variant availability</span>
            <select
              defaultValue={variant?.is_active === false ? "false" : "true"}
              id="variant-active"
              name="variantActive"
            >
              <option value="true">Available</option>
              <option value="false">Unavailable</option>
            </select>
            <FieldError>{error("variantActive")}</FieldError>
          </label>
        </div>
      </section>

      <div className={styles.formActions}>
        <Button disabled={pending} type="submit">
          {pending ? "Saving…" : editing ? "Save product" : "Create product"}
        </Button>
        <Link className={styles.cancelLink} href="/admin/products">
          Cancel
        </Link>
      </div>
      <span className={styles.srOnly} aria-live="polite">
        {pending ? "Saving product" : ""}
      </span>
    </form>
  );
}
