import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ErrorState } from "@repo/ui/error-state";
import {
  formatPrice,
  getCatalogProductBySlug,
  getCatalogProducts,
  type CatalogProduct,
} from "../../../lib/catalog";
import { getProductDetails } from "../../../lib/product-details";
import { ProductGallery } from "../../components/product-gallery";
import { ProductIcon } from "../../components/product-icon";
import { ProductPurchase } from "./product-purchase";
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
        getProductDetails(product).overview ||
        `Explore ${product.name} from Argania Professional.`,
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
  let product: CatalogProduct | null;
  try {
    product = await getCatalogProductBySlug(slug);
  } catch {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <ErrorState
            className={styles.error}
            description="Please try again in a moment."
            title="We couldn’t load this product"
            action={<Link href="/products">Back to the collection</Link>}
          />
        </div>
      </main>
    );
  }
  if (!product) notFound();

  const details = getProductDetails(product);
  let companions: CatalogProduct[] = [];
  try {
    const { products } = await getCatalogProducts();
    companions = products
      .filter((candidate) => candidate.id !== product.id)
      .sort(
        (a, b) =>
          Number(b.category?.slug === product.category?.slug) -
          Number(a.category?.slug === product.category?.slug),
      )
      .slice(0, 3);
  } catch {
    // Related products are optional; the current product remains available.
  }
  const benefits = details.benefits.slice(0, 3);
  const storyImage = product.images[2] ?? product.images[0];
  const editorialImages = product.images.slice(1, 4);
  const categoryPath = product.category
    ? `/products?category=${encodeURIComponent(product.category.slug)}`
    : "/products";

  return (
    <main className={styles.page} data-product-page>
      <div className={styles.container}>
        <nav aria-label="Breadcrumb" className={styles.crumb}>
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href={categoryPath}>
            {product.category?.name ?? "Collection"}
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{product.name}</span>
        </nav>
        <div className={styles.hero}>
          <ProductGallery
            key={product.id}
            images={product.images}
            productName={product.name}
          />
          <ProductPurchase
            key={product.id}
            product={product}
            cartError={cartError}
          />
        </div>
      </div>
      <div className={styles.scrollHint}>
        <span>THOUGHTFUL CARE. EVERYDAY RITUALS.</span>
        <a href="#product-details">
          DISCOVER THE DETAILS <span aria-hidden="true">↓</span>
        </a>
      </div>

      {benefits.length ? (
        <section
          className={styles.benefitsBlock}
          id="product-details"
          aria-labelledby="benefits-heading"
        >
          <div className={styles.container}>
            <div className={`${styles.headingRow} ${styles.sectionHeading}`}>
              <div>
                <span className={styles.overline}>
                  A LITTLE CARE, EVERY DAY
                </span>
                <h2 id="benefits-heading">
                  Good things for
                  <br />
                  <em>your daily ritual.</em>
                </h2>
              </div>
              <p>{details.benefitsText}</p>
            </div>
            <div className={styles.benefitGrid}>
              {benefits.map((benefit, index) => {
                const image = product.images[index + 1] ?? product.images[0];
                return (
                  <article className={styles.benefit} key={benefit}>
                    <div className={styles.benefitNum}>
                      0{index + 1} / WHY YOU’LL LOVE IT
                    </div>
                    {image ? (
                      <div className={styles.benefitArt}>
                        <img src={image.url} alt={image.alt} loading="lazy" />
                      </div>
                    ) : (
                      <div
                        className={`${styles.benefitArt} ${styles.benefitPlaceholder}`}
                      >
                        <ProductIcon name="leaf" />
                      </div>
                    )}
                    <div className={styles.benefitCopy}>
                      <h3>{benefit.replace(/\.$/, "")}</h3>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <section
        className={styles.storyBand}
        id={benefits.length ? undefined : "product-details"}
        aria-labelledby="story-heading"
      >
        <div className={`${styles.container} ${styles.storyGrid}`}>
          <div className={styles.storyVisual}>
            {storyImage ? (
              <img src={storyImage.url} alt={storyImage.alt} loading="lazy" />
            ) : (
              <div className={styles.storyPlaceholder}>
                <span>A</span>
                <small>ARGANIA PROFESSIONAL</small>
              </div>
            )}
            <div className={styles.storySeal}>
              <ProductIcon name="leaf" />
              <span>
                ARGANIA
                <br />
                PROFESSIONAL
              </span>
            </div>
          </div>
          <div className={styles.storyCopy}>
            <span className={styles.overline}>THE DETAILS THAT MATTER</span>
            <h2 id="story-heading">
              Made for a<br />
              <em>moment of care.</em>
            </h2>
            <p>
              {details.overview ||
                `Meet ${product.name}, from the Argania Professional collection.`}
            </p>
            {details.ingredients ? (
              <div className={styles.ingredientNote}>
                <span className={styles.overline}>HIGHLIGHTED INGREDIENTS</span>
                <p>{details.ingredients}</p>
              </div>
            ) : null}
            <div className={styles.storyBullets}>
              {details.productType ? (
                <span>
                  <span>01</span>
                  <b>{details.productType}</b>
                  <small>YOUR EVERYDAY ESSENTIAL</small>
                </span>
              ) : null}
              <span>
                <span>{details.productType ? "02" : "01"}</span>
                <b>{product.category?.name ?? "Personal care"}</b>
                <small>THE ARGANIA COLLECTION</small>
              </span>
            </div>
            <a className={styles.outlineLink} href="#product-purchase">
              Find your ritual <ProductIcon name="arrow" />
            </a>
          </div>
        </div>
      </section>

      {details.usage.length ? (
        <section
          className={`${styles.container} ${styles.stepsSection}`}
          aria-labelledby="routine-heading"
        >
          <div className={styles.sectionHeading}>
            <span className={styles.overline}>MAKE A LITTLE TIME FOR YOU</span>
            <h2 id="routine-heading">
              Your ritual,
              <br />
              <em>made simple.</em>
            </h2>
          </div>
          <div className={styles.stepGrid}>
            {details.usage.map((step, index) => (
              <article key={`${index}-${step}`}>
                <span className={styles.stepCount}>0{index + 1}</span>
                <h3>Step {index + 1}</h3>
                <p>{step}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section
        className={`${styles.container} ${styles.faq}`}
        aria-labelledby="faq-heading"
      >
        <div>
          <span className={styles.overline}>A FEW THINGS TO KNOW</span>
          <h2 id="faq-heading">
            A little clarity.
            <br />
            <em>A little care.</em>
          </h2>
          <p>Get to know your next everyday essential.</p>
        </div>
        <div>
          {details.usage.length ? (
            <details>
              <summary>
                How do I use this product?<span aria-hidden="true">+</span>
              </summary>
              <p>{details.usage.join(" ")}</p>
            </details>
          ) : null}
          {details.ingredients ? (
            <details>
              <summary>
                What are the highlighted ingredients?
                <span aria-hidden="true">+</span>
              </summary>
              <p>
                {details.ingredients} See the packaging for the complete
                ingredient list.
              </p>
            </details>
          ) : null}
          <details>
            <summary>
              Which sizes are available?<span aria-hidden="true">+</span>
            </summary>
            <p>
              {product.variants
                .map(
                  (variant) =>
                    getProductDetails(product, variant).size ?? variant.name,
                )
                .join(" · ")}
              . Select a size above to see its current price and availability.
            </p>
          </details>
          <details>
            <summary>
              How do I check delivery options?<span aria-hidden="true">+</span>
            </summary>
            <p>
              Add your selected items to your bag and enter your delivery
              address at checkout. Available shipping options and charges are
              shown before payment.
            </p>
          </details>
        </div>
      </section>

      {editorialImages.length ? (
        <section
          className={styles.galleryEdit}
          aria-labelledby="gallery-heading"
        >
          <div className={styles.container}>
            <div className={styles.sectionHeading}>
              <span className={styles.overline}>A CLOSER LOOK</span>
              <h2 id="gallery-heading">
                Part of your
                <br />
                <em>everyday story.</em>
              </h2>
            </div>
            <div className={styles.editorialGrid}>
              {editorialImages.map((image) => (
                <div key={image.url}>
                  <img src={image.url} alt={image.alt} loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {companions.length ? (
        <section
          className={`${styles.container} ${styles.related}`}
          aria-labelledby="related-heading"
        >
          <div className={`${styles.sectionHeading} ${styles.headingRow}`}>
            <div>
              <span className={styles.overline}>BETTER TOGETHER</span>
              <h2 id="related-heading">
                Complete
                <br />
                <em>your ritual.</em>
              </h2>
            </div>
            <Link className={styles.collectionLink} href={categoryPath}>
              Explore the collection <ProductIcon name="arrow" />
            </Link>
          </div>
          <div className={styles.relatedGrid}>
            {companions.map((companion) => (
              <Link
                className={styles.relatedCard}
                key={companion.id}
                href={`/products/${encodeURIComponent(companion.slug)}`}
              >
                <div className={styles.relatedPhoto}>
                  {companion.images[0] ? (
                    <img
                      src={companion.images[0].url}
                      alt={companion.images[0].alt}
                      loading="lazy"
                    />
                  ) : (
                    <span className={styles.relatedPlaceholder}>A</span>
                  )}
                </div>
                <div className={styles.relatedMeta}>
                  <span>
                    {companion.category?.name ?? "ARGANIA PROFESSIONAL"}
                  </span>
                  <h3>{companion.name}</h3>
                  <p>
                    {companion.variants[0] &&
                    !companion.variants[0].priceNeedsConfirmation
                      ? formatPrice(companion.variants[0].price)
                      : "Price on request"}
                    <span>
                      Discover <span aria-hidden="true">↗</span>
                    </span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
