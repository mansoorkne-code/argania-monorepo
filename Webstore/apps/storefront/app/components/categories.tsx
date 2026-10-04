import Link from "next/link";
import { getCatalogCategories } from "../../lib/catalog";
import styles from "./categories.module.css";

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
      <h2 className={styles.heading} id="shop-by-categories">
        Shop By Categories
      </h2>
      <nav aria-label="Shop by category" className={styles.categoryList}>
        {categories.map((category) => (
          <Link
            aria-label={`Shop ${category.name}`}
            className={styles.category}
            href={`/products?category=${encodeURIComponent(category.slug)}`}
            key={category.id}
          >
            <span
              aria-hidden="true"
              className={styles.image}
              style={
                category.imageUrl
                  ? {
                      backgroundImage: `url(${JSON.stringify(category.imageUrl)})`,
                    }
                  : undefined
              }
            >
              {!category.imageUrl
                ? category.name.charAt(0).toUpperCase()
                : null}
            </span>
            <span className={styles.name}>{category.name}</span>
          </Link>
        ))}
      </nav>
    </section>
  );
}
