import type { Metadata } from "next";
import Link from "next/link";
import { ErrorState } from "@repo/ui/error-state";
import {
  requireCategoryAdmin,
  getAdminCategories,
} from "../../../../lib/categories";
import { CategoryForm } from "../category-form";
import { createCategoryAction } from "../actions";
import styles from "../categories.module.css";

export const metadata: Metadata = { title: "Create category" };
export default async function NewCategoryPage() {
  const supabase = await requireCategoryAdmin();
  let categories;
  try {
    categories = await getAdminCategories(supabase);
  } catch {
    return (
      <ErrorState
        title="Unable to load parent categories"
        description="Try again after applying the category management migration."
        action={<Link href="/admin/categories/new">Try again</Link>}
      />
    );
  }
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link href="/admin/categories">Categories</Link>
          <h2>Create category</h2>
        </div>
      </header>
      <CategoryForm action={createCategoryAction} categories={categories} />
    </section>
  );
}
