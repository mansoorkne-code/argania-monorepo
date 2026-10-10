import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { ErrorState } from "@repo/ui/error-state";
import { formatPrice, getCatalogProductBySlug } from "../../../lib/catalog";
import { addCartItem } from "../../cart/actions";
import { ProductGallery } from "../../components/product-gallery";
import styles from "./product.module.css";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ cart_error?: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getCatalogProductBySlug(slug);
    if (!product) return { title: "Product not found | Argania" };

    return {
      title: `${product.name} | Argania`,
      description:
        product.description ?? `Explore ${product.name} from Argania.`,
    };
  } catch {
    return { title: "Product | Argania" };
  }
}

export default async function ProductPage({
  params,
  searchParams,
}: ProductPageProps) {
  const { slug } = await params;
  const { cart_error: cartError } = searchParams ? await searchParams : {};
  let product;
  try {
    product = await getCatalogProductBySlug(slug);
  } catch {
    return (
      <main className={styles.page}>
        <ErrorState
          className={styles.error}
          description="Please try again in a moment."
          title="We couldn’t load this product"
          action={<Link href="/products">Back to the collection</Link>}
        />
      </main>
    );
  }

  if (!product) notFound();

  const price = product.variants[0]?.price;
  const inStockVariants = product.variants.filter(
    (variant) => variant.stockQuantity > 0,
  );

  return (
    <main className={styles.page}>
      <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
        <Link href="/products">Collection</Link>
        <span aria-hidden="true">/</span>
        {product.category ? (
          <Link
            href={`/products?category=${encodeURIComponent(product.category.slug)}`}
          >
            {product.category.name}
          </Link>
        ) : null}
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className={styles.productLayout}>
        <ProductGallery images={product.images} productName={product.name} />

        <section className={styles.productInfo}>
          <span className={styles.kicker}>
            ARGANIA PROFESSIONAL /{" "}
            {product.category?.name ?? "THE ARGANIA EDIT"}
          </span>
          <h1>{product.name}</h1>
          {price !== undefined ? (
            <p className={styles.price}>
              {product.variants.length > 1 ? "From " : ""}
              {formatPrice(price)}
            </p>
          ) : null}
          {product.description ? (
            <p className={styles.description}>{product.description}</p>
          ) : null}
          {cartError ? (
            <p className={styles.cartError} role="alert">
              {cartError === "stock"
                ? "There isn’t enough stock for that quantity."
                : cartError === "unavailable"
                  ? "This option is no longer available."
                  : "We couldn’t add this item. Please try again."}
            </p>
          ) : null}

          <div aria-label="Available options" className={styles.variants}>
            <h2>Choose your option</h2>
            {product.variants.map((variant) => (
              <div className={styles.variant} key={variant.id}>
                <div>
                  <h3>{variant.name}</h3>
                  {Object.entries(variant.attributes).length ? (
                    <p>
                      {Object.entries(variant.attributes)
                        .map(([name, value]) => `${name}: ${value}`)
                        .join(" · ")}
                    </p>
                  ) : null}
                </div>
                <div className={styles.variantPrice}>
                  <span>{formatPrice(variant.price)}</span>
                  {variant.compareAtPrice &&
                  variant.compareAtPrice > variant.price ? (
                    <span className={styles.compareAtPrice}>
                      {formatPrice(variant.compareAtPrice)}
                    </span>
                  ) : null}
                  {variant.stockQuantity <= 0 ? (
                    <Badge variant="warning">Out of stock</Badge>
                  ) : null}
                </div>
                {variant.stockQuantity > 0 ? (
                  <form action={addCartItem} className={styles.addForm}>
                    <input name="variantId" type="hidden" value={variant.id} />
                    <input
                      name="productSlug"
                      type="hidden"
                      value={product.slug}
                    />
                    <input name="quantity" type="hidden" value="1" />
                    <Button size="sm" type="submit">
                      Add to bag
                    </Button>
                  </form>
                ) : null}
              </div>
            ))}
          </div>

          <p className={styles.shippingNote}>
            Complimentary delivery on orders over ₹2,500.
          </p>
        </section>
      </div>

      <section
        aria-labelledby="product-details-title"
        className={styles.detailsSection}
      >
        <div className={styles.detailsIntro}>
          <span className={styles.kicker}>THE ARGANIA EDIT</span>
          <h2 id="product-details-title">A little more about your ritual.</h2>
          <p>
            Thoughtful care, made to find its place in your everyday routine.
          </p>
        </div>
        <div className={styles.detailsGrid}>
          <article>
            <span>01 / PRODUCT DETAILS</span>
            <h3>Made for your routine</h3>
            <p>
              {product.description ||
                `Explore ${product.name} from Argania Professional.`}
            </p>
          </article>
          <article>
            <span>02 / AVAILABLE OPTIONS</span>
            <h3>Find your fit</h3>
            <p>
              {product.variants.map((variant) => variant.name).join(" · ") ||
                "See available options above."}
            </p>
          </article>
          <article>
            <span>03 / AVAILABILITY</span>
            <h3>
              {inStockVariants.length
                ? "Ready to be yours"
                : "Currently unavailable"}
            </h3>
            <p>
              {inStockVariants.length
                ? `${inStockVariants.length} option${inStockVariants.length === 1 ? "" : "s"} currently available to add to your bag.`
                : "Please check back soon for availability."}
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
