import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
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
    available?: string | string[];
    sort?: string | string[];
  }>;
};

type ProductSort = "featured" | "price-low" | "price-high" | "az";

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function sortProducts<
  T extends { name: string; variants: { price: number }[] },
>(products: T[], sort: ProductSort) {
  return [...products].sort((a, b) => {
    if (sort === "az") return a.name.localeCompare(b.name);
    if (sort === "price-low")
      return (
        (a.variants[0]?.price ?? Infinity) - (b.variants[0]?.price ?? Infinity)
      );
    if (sort === "price-high")
      return (
        (b.variants[0]?.price ?? -Infinity) -
        (a.variants[0]?.price ?? -Infinity)
      );
    return 0;
  });
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = await searchParams;
  const search = firstValue(params.q)?.trim().slice(0, 80) ?? "";
  const categorySlug = firstValue(params.category) ?? "";
  const availableOnly = firstValue(params.available) === "1";
  const sortParam = firstValue(params.sort);
  const sort: ProductSort = [
    "featured",
    "price-low",
    "price-high",
    "az",
  ].includes(sortParam ?? "")
    ? (sortParam as ProductSort)
    : "featured";
  const requestedPage = Number.parseInt(firstValue(params.p) ?? "1", 10);
  const page = Number.isFinite(requestedPage)
    ? Math.min(10_000, Math.max(1, requestedPage))
    : 1;

  try {
    const categories = await getCatalogCategories();
    const selectedCategory =
      categories.find((category) => category.slug === categorySlug) ??
      categories.find(
        (category) =>
          category.slug.replaceAll("-", "").toLowerCase() ===
          categorySlug.replaceAll("-", "").toLowerCase(),
      );
    const result =
      categorySlug && !selectedCategory
        ? { products: [], totalCount: 0 }
        : await getCatalogProducts({
            categoryId: selectedCategory?.id,
            search: search || undefined,
            page,
            availableOnly,
          });
    const products = sortProducts(result.products, sort);
    const totalPages = Math.ceil(result.totalCount / catalogPageSize);

    function pageHref(targetPage: number) {
      const nextParams = new URLSearchParams();
      if (search) nextParams.set("q", search);
      if (categorySlug) nextParams.set("category", categorySlug);
      if (availableOnly) nextParams.set("available", "1");
      if (sort !== "featured") nextParams.set("sort", sort);
      if (targetPage > 1) nextParams.set("p", String(targetPage));
      const query = nextParams.toString();
      return query ? `/products?${query}` : "/products";
    }

    function categoryHref(slug: string) {
      const nextParams = new URLSearchParams();
      if (search) nextParams.set("q", search);
      if (slug) nextParams.set("category", slug);
      if (availableOnly) nextParams.set("available", "1");
      if (sort !== "featured") nextParams.set("sort", sort);
      const query = nextParams.toString();
      return query ? `/products?${query}` : "/products";
    }

    if (totalPages > 0 && page > totalPages) redirect(pageHref(totalPages));

    const categoryTitle = selectedCategory?.name ?? "";
    const introTitle = categoryTitle
      ? `${categoryTitle}, thoughtfully.`
      : "The beauty edit.";
    const introDescription = categoryTitle.toLowerCase().includes("body")
      ? "Everyday moisturisers and body-care essentials designed to feel comfortable, simple and indulgent."
      : "Professional care and the little essentials that make everyday beauty feel special.";

    return (
      <main className={styles.page}>
        <section className={styles.intro}>
          <div className={styles.container}>
            <span className={styles.kicker}>The Argania collection</span>
            <h1>{introTitle}</h1>
            <p>{search ? `Results for “${search}”` : introDescription}</p>
          </div>
        </section>

        <form
          action="/products"
          className={`${styles.container} ${styles.collection}`}
        >
          <aside aria-label="Refine the collection" className={styles.sidebar}>
            <h2>Refine your ritual</h2>
            <div className={styles.filterGroup}>
              <h3>Shop by collection</h3>
              <Link
                aria-current={!categorySlug ? "page" : undefined}
                className={styles.categoryLink}
                href={categoryHref("")}
              >
                <span>All</span>
                <span>{!categorySlug ? result.totalCount : ""}</span>
              </Link>
              {categories.map((category) => (
                <Link
                  aria-current={
                    categorySlug === category.slug ? "page" : undefined
                  }
                  className={styles.categoryLink}
                  href={categoryHref(category.slug)}
                  key={category.id}
                >
                  <span>{category.name}</span>
                  <span>
                    {categorySlug === category.slug ? result.totalCount : ""}
                  </span>
                </Link>
              ))}
            </div>
            {categorySlug ? (
              <input name="category" type="hidden" value={categorySlug} />
            ) : null}
            <div className={styles.filterGroup}>
              <h3>Availability</h3>
              <label className={styles.availabilityOption}>
                <input
                  defaultChecked={availableOnly}
                  name="available"
                  type="checkbox"
                  value="1"
                />
                <span>Available now</span>
              </label>
            </div>
            <button className={styles.applyFilters} type="submit">
              Apply filters
            </button>
            {search || categorySlug || availableOnly || sort !== "featured" ? (
              <Link className={styles.clearFilters} href="/products">
                Clear filters
              </Link>
            ) : null}
          </aside>

          <section aria-label="Product collection" className={styles.catalog}>
            <div className={styles.toolbar}>
              <p>
                Showing {result.totalCount}{" "}
                {result.totalCount === 1 ? "product" : "products"}
              </p>
              <label className={styles.searchField}>
                <span className="sr-only">Search products</span>
                <input
                  defaultValue={search}
                  maxLength={80}
                  name="q"
                  placeholder="Search products"
                />
              </label>
              <label className={styles.sortField}>
                <span>Sort by</span>
                <select defaultValue={sort} name="sort">
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                  <option value="az">Alphabetical</option>
                </select>
              </label>
            </div>

            {products.length ? (
              <div className={styles.productGrid}>
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className={styles.emptyResults}>
                <span className={styles.kicker}>Something good is coming</span>
                <h2>
                  {categoryTitle
                    ? `Your ${categoryTitle.toLowerCase()} ritual is on its way.`
                    : "No products found"}
                </h2>
                <p>
                  Try a different search or clear your filters to browse the
                  full collection.
                </p>
                <Link href="/products">Shop the collection ↗</Link>
              </div>
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
        </form>
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
