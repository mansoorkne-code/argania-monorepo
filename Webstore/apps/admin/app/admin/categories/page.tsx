import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getSupabasePublicConfig } from "../../../lib/supabase/config";
import { categoryImageUrl } from "../../../lib/category-images";
import { ErrorState } from "@repo/ui/error-state";
import { getCategoryAccess, getAdminCategories } from "../../../lib/categories";
import { flattenCategories } from "../../../lib/category-tree";
import { CategoryOperation } from "./category-operations";
import styles from "./categories.module.css";

export const metadata: Metadata = { title: "Categories" };
const notices: Record<string, string> = {
  created: "Category created.",
  updated: "Category updated.",
  archived: "Category archived.",
  deleted: "Category deleted.",
};

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const { supabase, role } = await getCategoryAccess();
  const params = await searchParams;
  let categories;
  try {
    categories = await getAdminCategories(supabase);
  } catch {
    return (
      <ErrorState
        title="Unable to load categories"
        description="Please apply the category management migration and try again."
        action={<Link href="/admin/categories">Try again</Link>}
      />
    );
  }
  const rows = flattenCategories(categories);
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Catalog</p>
          <h2>Categories</h2>
          <p>Organize products into categories and nested collections.</p>
        </div>
        {role === "admin" && (
          <Link className={styles.addLink} href="/admin/categories/new">
            Create category
          </Link>
        )}
      </header>
      {notices[params.notice ?? ""] && (
        <p className={styles.notice} role="status">
          {notices[params.notice ?? ""]}
        </p>
      )}
      {params.error === "forbidden" && (
        <p className={styles.error} role="alert">
          Only admins can change categories.
        </p>
      )}
      {role === "manager" && (
        <p className={styles.notice}>
          You have read-only access. Category changes require an admin.
        </p>
      )}
      {rows.length ? (
        <div className={styles.tableFrame}>
          <table className={styles.table}>
            <caption className={styles.caption}>
              Category hierarchy and dependencies
            </caption>
            <thead>
              <tr>
                <th scope="col">Category</th>
                <th scope="col">Slug</th>
                <th scope="col">Status</th>
                <th scope="col">Dependencies</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ category, depth, path }) => {
                const children = categories.filter(
                  (child) => child.parent_id === category.id,
                );
                const canArchive =
                  category.activeProductCount === 0 &&
                  children.every((child) => child.status === "archived");
                const canDelete =
                  category.productCount === 0 &&
                  children.length === 0 &&
                  !category.image_path;
                return (
                  <tr key={category.id}>
                    <th scope="row">
                      <div
                        style={{
                          paddingInlineStart: `${Math.min(depth, 8) * 16}px`,
                        }}
                      >
                        <strong>
                          {category.image_path && (
                            <Image
                              className={styles.thumbnail}
                              src={categoryImageUrl(
                                getSupabasePublicConfig().url,
                                category.image_path,
                              )}
                              alt={category.image_alt || category.name}
                              width={48}
                              height={48}
                              unoptimized
                            />
                          )}
                          {depth > 0 && <span aria-hidden="true">↳ </span>}
                          {category.name}
                        </strong>
                        <small>{path}</small>
                      </div>
                    </th>
                    <td>{category.slug}</td>
                    <td>
                      <span className={styles.badge}>{category.status}</span>
                    </td>
                    <td>
                      {category.productCount} products (
                      {category.activeProductCount} active)
                      <br />
                      {children.length} child categories
                    </td>
                    <td>
                      {role === "admin" ? (
                        <>
                          <div className={styles.actions}>
                            <Link
                              href={`/admin/categories/${category.id}/edit`}
                            >
                              Edit
                            </Link>
                            {category.status !== "archived" && (
                              <CategoryOperation
                                id={category.id}
                                name={category.name}
                                operation="archive"
                                disabled={!canArchive}
                              />
                            )}
                            <CategoryOperation
                              id={category.id}
                              name={category.name}
                              operation="delete"
                              disabled={!canDelete}
                            />
                          </div>
                          {(!canArchive || !canDelete) && (
                            <small>
                              Archive: resolve active products and unarchived
                              children. Delete: remove all references and the
                              category image.
                            </small>
                          )}
                        </>
                      ) : (
                        "Read only"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.empty}>
          <h3>No categories yet</h3>
          <p>Create your first category to organize the catalog.</p>
        </div>
      )}
    </section>
  );
}
