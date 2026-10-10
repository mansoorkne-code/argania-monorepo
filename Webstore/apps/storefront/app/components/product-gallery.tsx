"use client";

import { useState } from "react";
import type { CatalogImage } from "../../lib/catalog";
import styles from "../products/[slug]/product.module.css";

type ProductGalleryProps = {
  images: CatalogImage[];
  productName: string;
};

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex];

  return (
    <section aria-label={`${productName} images`} className={styles.gallery}>
      <div className={styles.primaryImage}>
        {activeImage ? (
          <img alt={activeImage.alt} src={activeImage.url} />
        ) : (
          <div aria-label={`${productName} image coming soon`} role="img">
            <span>ARGANIA</span>
          </div>
        )}
        {images.length > 1 ? (
          <>
            <button
              aria-label="Previous product image"
              className={`${styles.galleryControl} ${styles.previous}`}
              onClick={() =>
                setActiveIndex(
                  (index) => (index - 1 + images.length) % images.length,
                )
              }
              type="button"
            >
              ‹
            </button>
            <button
              aria-label="Next product image"
              className={`${styles.galleryControl} ${styles.next}`}
              onClick={() =>
                setActiveIndex((index) => (index + 1) % images.length)
              }
              type="button"
            >
              ›
            </button>
            <span className={styles.imageCount}>
              {activeIndex + 1} / {images.length}
            </span>
          </>
        ) : null}
      </div>
      {images.length > 1 ? (
        <div aria-label="Choose product image" className={styles.thumbnails}>
          {images.map((image, index) => (
            <button
              aria-current={activeIndex === index ? "true" : undefined}
              aria-label={`View product image ${index + 1}`}
              className={
                activeIndex === index ? styles.activeThumbnail : undefined
              }
              key={`${image.url}-${index}`}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <img alt="" loading="lazy" src={image.url} />
            </button>
          ))}
        </div>
      ) : null}
      <p className={styles.galleryCaption}>
        Product photos first, followed by details and everyday inspiration.
      </p>
    </section>
  );
}
