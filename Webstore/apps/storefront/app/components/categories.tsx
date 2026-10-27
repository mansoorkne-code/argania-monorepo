import Link from "next/link";
import { getCatalogCategories } from "../../lib/catalog";
import { getStorefrontAssetUrl } from "../../lib/storefront-assets";
import { SectionHeading } from "./section-heading";
const collections = [
  {
    slug: "haircare",
    name: "Haircare",
    image: "hairspa-wash",
    kicker: "THE HAIR EDIT",
    description: "Shampoos, conditioners & hair treatments",
    alt: "Haircare and salon treatment",
  },
  {
    slug: "skincare",
    name: "Skincare",
    image: "glow-bathroom",
    kicker: "THE SKIN EDIT",
    description: "Serums, moisturisers & daily essentials",
    alt: "Skincare with Glow Detoxic serum",
  },
  {
    slug: "bodycare",
    name: "Body care",
    image: "aloe-hero",
    kicker: "EVERYDAY COMFORT",
    description: "Moisturisers and daily body-care essentials",
    alt: "Natural personal care botanical scene",
  },
];
export async function Categories() {
  const categories = await getCatalogCategories().catch(() => []);
  return (
    <section
      className="section-space container home-category-section"
      id="shop-categories"
      aria-label="Shop by category"
    >
      <SectionHeading
        kicker="EXPLORE ARGANIA"
        title="Shop by category"
        description="Find the right everyday ritual for your hair, skin and body."
        href="/products"
        linkText="Shop all"
      />
      <div className="home-category-grid">
        {collections.map((collection, index) => {
          const category = categories.find(
            (item) =>
              item.slug.replaceAll("-", "").toLowerCase() === collection.slug,
          );
          return (
            <Link
              className="home-category-card"
              href={`/products?category=${encodeURIComponent(category?.slug ?? collection.slug)}`}
              key={collection.slug}
              aria-label={`Shop ${category?.name ?? collection.name}`}
            >
              <div className="home-category-image">
                <img
                  src={
                    category?.imageUrl ||
                    getStorefrontAssetUrl(`assets/${collection.image}.webp`)
                  }
                  alt={category?.imageAlt || collection.alt}
                  loading="lazy"
                />
              </div>
              <div className="home-category-caption">
                <div>
                  <span>
                    {String(index + 1).padStart(2, "0")} / {collection.kicker}
                  </span>
                  <h3>{category?.name ?? collection.name}</h3>
                  <p>{category?.description || collection.description}</p>
                </div>
                <b aria-hidden="true">↗</b>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
