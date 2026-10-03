import Link from "next/link";
import { Badge } from "@repo/ui/badge";
import { Card } from "@repo/ui/card";
import { formatPrice, type CatalogProduct } from "../../lib/catalog";
import styles from "./products.module.css";

export function ProductCard({ product }: { product: CatalogProduct }) {
  const lowestPrice = product.variants[0]?.price;
  const image = product.images[0];

  return (
    <Card className={styles.productCard}>
      <Link
        aria-label={`View ${product.name}`}
        className={styles.productLink}
        href={`/products/${encodeURIComponent(product.slug)}`}
      >
        <div
          aria-label={image?.alt ?? `${product.name} product image`}
          className={styles.productImage}
          role="img"
          style={
            image
              ? { backgroundImage: `url(${JSON.stringify(image.url)})` }
              : undefined
          }
        >
          {!image ? <span aria-hidden="true">A</span> : null}
          {product.variants.every((variant) => variant.stockQuantity === 0) ? (
            <Badge className={styles.stockBadge} variant="warning">
              Out of stock
            </Badge>
          ) : null}
        </div>
        <div className={styles.productInfo}>
          <div className={styles.productTitleRow}>
            <h2>{product.name}</h2>
            {lowestPrice !== undefined ? (
              <span>{formatPrice(lowestPrice)}</span>
            ) : null}
          </div>
          <p>{product.category?.name ?? "Argania essentials"}</p>
        </div>
      </Link>
    </Card>
  );
}
