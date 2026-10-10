import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ErrorState } from "@repo/ui/error-state";
import { categoryIdSchema } from "@webstore/validations/category";
import {
  requireCategoryAdmin,
  getAdminCategories,
} from "../../../../../lib/categories";
import { CategoryForm } from "../../category-form";
import { updateCategoryAction } from "../../actions";
import styles from "../../categories.module.css";

export const metadata: Metadata = { title: "Edit category" };
export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await requireCategoryAdmin();
  const { id } = await params;
  if (!categoryIdSchema.safeParse(id).success) notFound();
  let categories;
  try {
    categories = await getAdminCategories(supabase);
  } catch {
    return (
      <ErrorState
        title="Unable to load category"
        description="Try again after applying the category management migration."
        action={<Link href={`/admin/categories/${id}/edit`}>Try again</Link>}
      />
    );
  }
  const category = categories.find((item) => item.id === id);
  if (!category) notFound();
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link href="/admin/categories">Categories</Link>
          <h2>Edit {category.name}</h2>
          <p>
            To restore an archived category, choose Draft or Active and save.
          </p>
        </div>
      </header>
      <CategoryForm
        action={updateCategoryAction.bind(null, id)}
        categories={categories}
        category={category}
      />
    </section>
  );
}
