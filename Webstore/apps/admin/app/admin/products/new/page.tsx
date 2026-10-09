import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorState } from "@repo/ui/error-state";
import { getProductAccess } from "../../../../lib/product-access";
import { getProductCategories } from "../../../../lib/products";
import { createProductAction } from "../actions";
import { ProductForm } from "../product-form";
import styles from "../products.module.css";

export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage() {
  const { supabase, role } = await getProductAccess();
  if (role !== "admin") redirect("/admin/products?error=forbidden");

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
              Create a product and its first sellable variant.
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
