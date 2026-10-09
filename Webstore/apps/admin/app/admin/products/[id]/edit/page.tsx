import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ErrorState } from "@repo/ui/error-state";
import { getProductAccess } from "../../../../../lib/product-access";
import type {
  AdminProductRecord,
  ProductCategoryOption,
} from "../../../../../lib/products";
import {
  getProductById,
  getProductCategories,
} from "../../../../../lib/products";
import { updateProductAction } from "../../actions";
import { ProductForm } from "../../product-form";
import { ImageManager } from "../../image-manager";
import styles from "../../products.module.css";

export const metadata: Metadata = { title: "Edit product" };

type EditProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    )
  ) {
    redirect("/admin/products?error=not-found");
  }
  const { supabase, role } = await getProductAccess();
  if (role !== "admin") redirect("/admin/products?error=forbidden");

  let product: AdminProductRecord | null;
  let categories: ProductCategoryOption[];
  try {
    [product, categories] = await Promise.all([
      getProductById(id, supabase),
      getProductCategories(supabase),
    ]);
  } catch {
    return (
      <ErrorState
        className={styles.loadError}
        title="Unable to load product"
        description="This product could not be loaded. It may have been removed or Supabase may be unavailable."
        action={<Link href="/admin/products">Back to products</Link>}
      />
    );
  }

  if (!product) notFound();
  const updateAction = updateProductAction.bind(null, product.id);
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>
            <Link href="/admin/products">Products</Link> / Edit
          </p>
          <h2>Edit product</h2>
          <p className={styles.pageDescription}>
            Update product details, category, status, price, or stock.
          </p>
        </div>
      </header>
      <ProductForm
        action={updateAction}
        categories={categories}
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          categoryId: product.category_id,
          status: product.status,
          primaryVariant: product.product_variants[0] ?? null,
          variantCount: product.product_variants.length,
        }}
      />
      <ImageManager
        images={product.product_images ?? []}
        productId={product.id}
        variants={product.product_variants}
      />
    </div>
  );
}
