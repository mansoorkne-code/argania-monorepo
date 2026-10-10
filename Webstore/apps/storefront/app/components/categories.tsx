import Link from "next/link";
import { getCatalogCategories } from "../../lib/catalog";
import styles from "./categories.module.css";
import { getStorefrontAssetUrl } from "../../lib/storefront-assets";

const categoryDetails: Record<
  string,
  { image: string; kicker: string; description: string }
> = {
  haircare: {
    image: "assets/hairspa-wash.webp",
    kicker: "THE HAIR EDIT",
    description: "Shampoos, conditioners & hair treatments",
  },
  skincare: {
    image: "assets/glow-bathroom.webp",
    kicker: "THE SKIN EDIT",
    description: "Serums, moisturisers & daily essentials",
  },
  bodycare: {
    image: "assets/aloe-hero.webp",
    kicker: "EVERYDAY COMFORT",
    description: "Moisturisers and daily body-care essentials",
  },
  "body-care": {
    image: "assets/aloe-hero.webp",
    kicker: "EVERYDAY COMFORT",
    description: "Moisturisers and daily body-care essentials",
  },
};

function getCategoryDetails(slug: string) {
  const normalizedSlug = slug.toLowerCase().replaceAll("-", "");
  return (
    categoryDetails[slug.toLowerCase()] ??
    (normalizedSlug.includes("hair") ? categoryDetails.haircare : undefined) ??
    (normalizedSlug.includes("skin") ? categoryDetails.skincare : undefined) ??
    (normalizedSlug.includes("body")
      ? categoryDetails.bodycare
      : undefined) ?? {
      image: "assets/aloe-hero.webp",
      kicker: "THE ARGANIA EDIT",
      description: "Thoughtful essentials for your everyday care",
    }
  );
}

export async function Categories() {
  let categories;

  try {
    categories = await getCatalogCategories();
  } catch {
    return null;
  }

  if (!categories.length) return null;

  return (
    <section aria-labelledby="shop-by-categories" className={styles.section}>
      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>EXPLORE ARGANIA</span>
          <h2 className={styles.headingTitle} id="shop-by-categories">
            Shop by category
          </h2>
          <p className={styles.headingDescription}>
            Find the right everyday ritual for your hair, skin and body.
          </p>
        </div>
        <Link className={styles.shopAll} href="/products">
          Shop all&nbsp; <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <nav aria-label="Shop by category" className={styles.categoryList}>
        {categories.map((category, index) => {
          const details = getCategoryDetails(category.slug);
          return (
            <Link
              aria-label={`Shop ${category.name}`}
              className={styles.category}
              href={`/products?category=${encodeURIComponent(category.slug)}`}
              key={category.id}
            >
              <span className={styles.imageWrap}>
                <img
                  className={styles.image}
                  src={
                    category.imageUrl || getStorefrontAssetUrl(details.image)
                  }
                  alt={category.name}
                  loading="lazy"
                />
              </span>
              <span className={styles.caption}>
                <span className={styles.copy}>
                  <span className={styles.kicker}>
                    {String(index + 1).padStart(2, "0")} / {details.kicker}
                  </span>
                  <h3 className={styles.name}>{category.name}</h3>
                  <p className={styles.description}>
                    {category.description || details.description}
                  </p>
                </span>
                <span aria-hidden="true" className={styles.arrow}>
                  ↗
                </span>
              </span>
            </Link>
          );
        })}
      </nav>
    </section>
  );
}
