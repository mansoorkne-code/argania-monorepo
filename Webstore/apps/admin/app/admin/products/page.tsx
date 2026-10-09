import type { Metadata } from "next";
import Link from "next/link";
import { ErrorState } from "@repo/ui/error-state";
import { Button } from "@repo/ui/button";
import { getProductAccess } from "../../../lib/product-access";
import {
  adminProductPageSize,
  getProductCategories,
  getProducts,
} from "../../../lib/products";
import { ArchiveProductForm } from "./archive-product-form";
import styles from "./products.module.css";

export const metadata: Metadata = { title: "Products" };

type ProductsPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
    category?: string | string[];
    p?: string | string[];
    notice?: string;
    error?: string;
  }>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function statusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function noticeText(notice?: string, error?: string) {
  if (notice === "created") return "Product created.";
  if (notice === "updated") return "Product updated.";
  if (notice === "archived")
    return "Product archived and removed from the storefront.";
  if (error === "forbidden") return "Only admins can change product data.";
  if (error === "archive-failed")
    return "Product could not be archived. Please try again.";
  if (error === "not-found") return "That product could not be found.";
  return null;
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const { supabase, role } = await getProductAccess();
  const params = await searchParams;
  const search = firstValue(params.q)?.trim().slice(0, 80) ?? "";
  const statusValue = firstValue(params.status) ?? "";
  const status = ["draft", "active", "archived"].includes(statusValue)
    ? (statusValue as "draft" | "active" | "archived")
    : undefined;
  const categoryId = firstValue(params.category) ?? "";
  const pageValue = Number.parseInt(firstValue(params.p) ?? "1", 10);
  const page = Number.isFinite(pageValue) ? Math.max(1, pageValue) : 1;
  const notice = noticeText(params.notice, params.error);

  try {
    const [{ products, totalCount }, categories] = await Promise.all([
      getProducts(
        { search, status, categoryId: categoryId || undefined, page },
        supabase,
      ),
      getProductCategories(supabase),
    ]);
    const totalPages = Math.ceil(totalCount / adminProductPageSize);

    function pageHref(targetPage: number) {
      const query = new URLSearchParams();
      if (search) query.set("q", search);
      if (status) query.set("status", status);
      if (categoryId) query.set("category", categoryId);
      if (targetPage > 1) query.set("p", String(targetPage));
      return query.size ? `/admin/products?${query}` : "/admin/products";
    }

    return (
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>Catalog</p>
            <h2>Products</h2>
            <p className={styles.pageDescription}>
              Search and manage products, categories, pricing, and availability.
            </p>
          </div>
          {role === "admin" ? (
            <Link
              className="ui-button ui-button--primary ui-button--md"
              href="/admin/products/new"
            >
              Add product
            </Link>
          ) : null}
        </header>

        {notice ? (
          <p className={styles.notice} role="status">
            {notice}
          </p>
        ) : null}

        <form action="/admin/products" className={styles.filters} method="get">
          <label className={styles.searchField}>
            <span>Search products</span>
            <input
              defaultValue={search}
              maxLength={80}
              name="q"
              placeholder="Name or keyword"
              type="search"
            />
          </label>
          <label>
            <span>Status</span>
            <select defaultValue={status ?? ""} name="status">
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label>
            <span>Category</span>
            <select defaultValue={categoryId} name="category">
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" variant="secondary">
            Filter
          </Button>
          {search || status || categoryId ? (
            <Link className={styles.clearFilters} href="/admin/products">
              Clear
            </Link>
          ) : null}
        </form>

        {products.length ? (
          <div className={styles.tableFrame}>
            <table className={styles.productTable}>
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Category</th>
                  <th scope="col">Price</th>
                  <th scope="col">Stock</th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className={styles.srOnly}>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const variants = product.product_variants ?? [];
                  const activeVariants = variants.filter(
                    (variant) => variant.is_active,
                  );
                  const prices = activeVariants.map((variant) =>
                    Number(variant.price),
                  );
                  const stock = activeVariants.reduce(
                    (sum, variant) => sum + variant.stock_quantity,
                    0,
                  );
                  return (
                    <tr key={product.id}>
                      <td>
                        <div className={styles.productIdentity}>
                          <span
                            aria-hidden="true"
                            className={styles.productGlyph}
                          >
                            {product.name.charAt(0).toUpperCase()}
                          </span>
                          <span>
                            <strong>{product.name}</strong>
                            <small>/products/{product.slug}</small>
                          </span>
                        </div>
                      </td>
                      <td>{product.category?.name ?? "Uncategorized"}</td>
                      <td>
                        {prices.length ? formatPrice(Math.min(...prices)) : "—"}
                      </td>
                      <td>{activeVariants.length ? stock : "—"}</td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${styles[`status_${product.status}`]}`}
                        >
                          {statusLabel(product.status)}
                        </span>
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          {role === "admin" ? (
                            <Link
                              className={styles.editLink}
                              href={`/admin/products/${product.id}/edit`}
                            >
                              Edit
                            </Link>
                          ) : null}
                          {role === "admin" && product.status !== "archived" ? (
                            <ArchiveProductForm
                              productId={product.id}
                              productName={product.name}
                            />
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyProducts}>
            <h3>No products found</h3>
            <p>
              Change the search or filters, or create a product to get started.
            </p>
            {role === "admin" ? (
              <Link href="/admin/products/new">Create your first product</Link>
            ) : null}
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
              Page {page} of {totalPages} · {totalCount} products
            </span>
            {page < totalPages ? (
              <Link href={pageHref(page + 1)}>Next →</Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </div>
    );
  } catch {
    return (
      <ErrorState
        className={styles.loadError}
        description="Product data could not be loaded. Check your Supabase connection and try again."
        title="Unable to load products"
        action={<Link href="/admin/products">Try again</Link>}
      />
    );
  }
}
