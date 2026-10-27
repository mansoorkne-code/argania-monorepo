import Link from "next/link";
import { formatPrice, type CatalogProduct } from "../../lib/catalog";
import { AddToBag } from "../cart/add-to-bag";
export function ProductCard({ product }: { product: CatalogProduct }) {
  const variant = product.variants[0];
  const available = product.variants.some((item) => item.stockQuantity > 0);
  const image = product.images[0];
  const path = `/products/${encodeURIComponent(product.slug)}`;
  return (
    <article
      className={`product-card${product.slug.includes("day-cream") ? " day-cream-listing" : ""}`}
    >
      <Link
        className="product-image"
        href={path}
        aria-label={`Explore ${product.name}`}
      >
        <span className={`pill${available ? "" : " out"}`}>
          {available ? "Argania essential" : "Currently sold out"}
        </span>
        {image ? (
          <img src={image.url} alt={image.alt} loading="lazy" />
        ) : (
          <span className="product-image-placeholder" aria-hidden="true">
            A
          </span>
        )}
      </Link>
      <Link
        className="product-heart"
        href="/account"
        aria-label={`Open your account for ${product.name}`}
        title="Your account"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.8 4.8a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.4a5.5 5.5 0 0 0 0-7.8Z" />
        </svg>
      </Link>
      <div className="product-details">
        <span className="product-category">
          {product.category?.name ?? "Argania essentials"}
          {variant?.name && <> &nbsp;/&nbsp; {variant.name}</>}
        </span>
        <Link href={path} className="product-title">
          {product.name}
        </Link>
        <p className="product-description">
          {product.description?.split(/[.!?]/)[0] ||
            "Thoughtful care for your everyday ritual"}
        </p>
        <div className="price-line">
          <strong>
            {variant ? formatPrice(variant.price) : "Price on request"}
          </strong>
        </div>
        {available && product.variants.length === 1 && variant ? (
          <AddToBag
            variantId={variant.id}
            productSlug={product.slug}
            buttonClassName="product-add"
          >
            Add to bag &nbsp; +
          </AddToBag>
        ) : available ? (
          <Link className="product-add" href={path}>
            Add to bag &nbsp; +
          </Link>
        ) : (
          <button className="product-add" disabled type="button">
            Currently unavailable
          </button>
        )}
      </div>
    </article>
  );
}
