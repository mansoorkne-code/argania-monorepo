import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@repo/ui/empty-state";
import { ErrorState } from "@repo/ui/error-state";
import {
  catalogPageSize,
  getCatalogCategories,
  getCatalogProducts,
} from "../../lib/catalog";
import { ProductCard } from "./product-card";
import styles from "./products.module.css";

export const metadata: Metadata = {
  title: "Shop the collection | Argania",
  description: "Explore thoughtful essentials and gentle rituals from Argania.",
};

type ProductsPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    category?: string | string[];
    p?: string | string[];
  }>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = await searchParams;
  const search = firstValue(params.q)?.trim().slice(0, 80) ?? "";
  const categorySlug = firstValue(params.category) ?? "";
  const requestedPage = Number.parseInt(firstValue(params.p) ?? "1", 10);
  const page = Number.isFinite(requestedPage)
    ? Math.min(10_000, Math.max(1, requestedPage))
    : 1;

  try {
    const categories = await getCatalogCategories();
    const selectedCategory = categories.find(
      (category) => category.slug === categorySlug,
    );
    const result =
      categorySlug && !selectedCategory
        ? { products: [], totalCount: 0 }
        : await getCatalogProducts({
            categoryId: selectedCategory?.id,
            search: search || undefined,
            page,
          });
    const totalPages = Math.ceil(result.totalCount / catalogPageSize);

    function pageHref(targetPage: number) {
      const nextParams = new URLSearchParams();
      if (search) nextParams.set("q", search);
      if (categorySlug) nextParams.set("category", categorySlug);
      if (targetPage > 1) nextParams.set("p", String(targetPage));
      const query = nextParams.toString();
      return query ? `/products?${query}` : "/products";
    }
    if (totalPages > 0 && page > totalPages) redirect(pageHref(totalPages));

    return (
      <main className={styles.page}>
        <section className={styles.intro}>
          <span className={styles.kicker}>The Argania edit</span>
          <h1>Thoughtful things for the everyday.</h1>
          <p>
            Considered essentials, made to find their place in your daily
            rituals.
          </p>
        </section>

        <section aria-label="Product collection" className={styles.collection}>
          <form action="/products" className={styles.filters}>
            <label className={styles.searchField}>
              <span>Search the collection</span>
              <input
                defaultValue={search}
                maxLength={80}
                name="q"
                placeholder="Try “oil” or “daily”"
              />
            </label>
            <label className={styles.categoryField}>
              <span>Category</span>
              <select defaultValue={categorySlug} name="category">
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <button className={styles.filterButton} type="submit">
              Show products
            </button>
            {search || categorySlug ? (
              <Link className={styles.clearFilters} href="/products">
                Clear filters
              </Link>
            ) : null}
          </form>

          {result.products.length ? (
            <div className={styles.productGrid}>
              {result.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState
              className={styles.emptyState}
              description="Try another search or browse all categories to find something that feels right."
              title="No products found"
              action={<Link href="/products">Browse the full collection</Link>}
            />
          )}
          {totalPages > 1 ? (
            <nav aria-label="Product pages" className={styles.pagination}>
              {page > 1 ? (
                <Link href={pageHref(page - 1)}>← Previous</Link>
              ) : (
                <span />
              )}
              <span>
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <Link href={pageHref(page + 1)}>Next →</Link>
              ) : (
                <span />
              )}
            </nav>
          ) : null}
        </section>
      </main>
    );
  } catch {
    return (
      <main className={styles.page}>
        <ErrorState
          className={styles.emptyState}
          description="The collection could not be loaded just now. Please try again in a moment."
          title="We couldn’t load the collection"
          action={<Link href="/products">Try again</Link>}
        />
      </main>
    );
  }
}
