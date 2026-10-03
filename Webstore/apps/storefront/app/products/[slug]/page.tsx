import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { ErrorState } from "@repo/ui/error-state";
import { formatPrice, getCatalogProductBySlug } from "../../../lib/catalog";
import { addCartItem } from "../../cart/actions";
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
        <section
          aria-label={`${product.name} images`}
          className={styles.gallery}
        >
          {product.images.length ? (
            product.images.map((image) => (
              <div
                aria-label={image.alt}
                className={styles.galleryImage}
                key={image.url}
                role="img"
                style={{ backgroundImage: `url(${JSON.stringify(image.url)})` }}
              />
            ))
          ) : (
            <div
              aria-label={`${product.name} image coming soon`}
              className={styles.galleryPlaceholder}
              role="img"
            >
              <span>ARGANIA</span>
            </div>
          )}
        </section>

        <section className={styles.productInfo}>
          <span className={styles.kicker}>
            {product.category?.name ?? "The Argania edit"}
          </span>
          <h1>{product.name}</h1>
          {price !== undefined ? (
            <p className={styles.price}>From {formatPrice(price)}</p>
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
            <h2>Options</h2>
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

          <p className={styles.comingSoon}>
            Your cart is saved to your Argania account.
          </p>
          <Link className={styles.backLink} href="/products">
            ← Back to the collection
          </Link>
        </section>
      </div>
    </main>
  );
}
