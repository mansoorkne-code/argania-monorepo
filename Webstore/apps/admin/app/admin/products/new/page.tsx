import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ErrorState } from "@repo/ui/error-state";
import { getProductAccess } from "../../../../lib/product-access";
import type {
  AdminProductRecord,
  ProductCategoryOption,
} from "../../../../lib/products";
import { getProductById, getProductCategories } from "../../../../lib/products";
import { createProductAction } from "../actions";
import { ImageManager } from "../image-manager";
import { ProductForm } from "../product-form";
import styles from "../products.module.css";

export const metadata: Metadata = { title: "Add product" };

type NewProductPageProps = {
  searchParams: Promise<{ productId?: string | string[] }>;
};

export default async function NewProductPage({
  searchParams,
}: NewProductPageProps) {
  const { supabase, role } = await getProductAccess();
  if (role !== "admin") redirect("/admin/products?error=forbidden");
  const productIdValue = (await searchParams).productId;
  const productId = Array.isArray(productIdValue)
    ? productIdValue[0]
    : productIdValue;

  if (productId) {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        productId,
      )
    ) {
      redirect("/admin/products/new");
    }

    let product: AdminProductRecord | null;
    try {
      product = await getProductById(productId, supabase);
    } catch {
      return (
        <ErrorState
          className={styles.loadError}
          title="Product created, but images could not be loaded"
          description="Open the product editor to try again."
          action={
            <Link href={`/admin/products/${productId}/edit`}>
              Open product editor
            </Link>
          }
        />
      );
    }
    if (!product) notFound();

    return (
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>
              <Link href="/admin/products">Products</Link> / Add images
            </p>
            <h2>Add images to {product.name}</h2>
            <p className={styles.pageDescription}>
              The product has been created. Upload and arrange its images now,
              or continue without images.
            </p>
          </div>
        </header>
        <p className={styles.notice} role="status">
          Product created. You can upload images here and edit them later.
        </p>
        <ImageManager
          images={product.product_images ?? []}
          productId={product.id}
          variants={product.product_variants}
        />
        <div className={styles.formActions}>
          <Link
            className={styles.cancelLink}
            href={`/admin/products/${product.id}/edit`}
          >
            Continue editing product
          </Link>
          <Link className={styles.cancelLink} href="/admin/products">
            Finish and return to products
          </Link>
        </div>
      </div>
    );
  }

  try {
    const categories = await getProductCategories(supabase);
    return (
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>
              <Link href="/admin/products">Products</Link> / New
            </p>
            <h2>Add product</h2>
            <p className={styles.pageDescription}>
              Create the product first; its image uploader opens in the next
              step.
            </p>
          </div>
        </header>
        <ProductForm action={createProductAction} categories={categories} />
      </div>
    );
  } catch {
    return (
      <ErrorState
        className={styles.loadError}
        title="Unable to load categories"
        description="Product categories could not be loaded. Try again."
        action={<Link href="/admin/products/new">Try again</Link>}
      />
    );
  }
}
