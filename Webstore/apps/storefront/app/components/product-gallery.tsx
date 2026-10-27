"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { CatalogImage } from "../../lib/catalog";
import { ProductIcon } from "./product-icon";
import styles from "../products/[slug]/product.module.css";

type ProductGalleryProps = {
  images: CatalogImage[];
  productName: string;
};

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const previousOverflow = useRef<string | null>(null);
  const titleId = useId();
  const index = images.length ? activeIndex % images.length : 0;
  const activeImage = images[index];
  const move = (direction: number) =>
    setActiveIndex((index + direction + images.length) % images.length);

  function restoreScrolling() {
    if (previousOverflow.current !== null) {
      document.body.style.overflow = previousOverflow.current;
      previousOverflow.current = null;
    }
  }

  function openImage() {
    if (!dialog.current || dialog.current.open) return;
    previousOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current.showModal();
  }

  useEffect(() => restoreScrolling, []);

  return (
    <section aria-label={`${productName} images`} className={styles.gallery}>
      {images.length > 1 ? (
        <div aria-label="Choose product image" className={styles.thumbs}>
          {images.map((image, imageIndex) => (
            <button
              aria-label={`View product image ${imageIndex + 1}`}
              aria-pressed={index === imageIndex}
              className={`${styles.thumb} ${index === imageIndex ? styles.activeThumbnail : ""}`}
              key={`${image.url}-${imageIndex}`}
              onClick={() => setActiveIndex(imageIndex)}
              type="button"
            >
              <img alt="" loading="lazy" src={image.url} />
            </button>
          ))}
        </div>
      ) : null}
      <div
        className={`${styles.stage} ${images.length < 2 ? styles.singleImage : ""}`}
      >
        <div className={styles.mainFrame}>
          {activeImage ? (
            <img
              alt={activeImage.alt || productName}
              className={styles.mainPhoto}
              src={activeImage.url}
              fetchPriority="high"
            />
          ) : (
            <div
              className={styles.imagePlaceholder}
              role="img"
              aria-label={`${productName} image coming soon`}
            >
              <span>A</span>
              <small>ARGANIA PROFESSIONAL</small>
            </div>
          )}
          <div className={styles.imageMeta}>
            <span className={styles.badge}>THE ARGANIA EDIT</span>
            {images.length > 0 ? (
              <span className={styles.imageCount} aria-live="polite">
                {index + 1} / {images.length}
              </span>
            ) : null}
          </div>
          {images.length > 1 ? (
            <div className={styles.imageNav}>
              <button
                aria-label="Previous product image"
                onClick={() => move(-1)}
                type="button"
              >
                ←
              </button>
              <button
                aria-label="Next product image"
                onClick={() => move(1)}
                type="button"
              >
                →
              </button>
            </div>
          ) : null}
          {activeImage ? (
            <button
              className={styles.zoom}
              aria-label="Enlarge product image"
              onClick={openImage}
              type="button"
            >
              <ProductIcon name="zoom" />
            </button>
          ) : null}
        </div>
        <p className={styles.imageCaption}>
          {activeImage
            ? "A closer look at your everyday ritual"
            : "Product photography coming soon"}
        </p>
      </div>
      <dialog
        aria-labelledby={titleId}
        className={styles.photoModal}
        onClose={restoreScrolling}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
        ref={dialog}
      >
        <h2 className="sr-only" id={titleId}>
          {productName} — enlarged image
        </h2>
        <button
          aria-label="Close enlarged image"
          onClick={() => dialog.current?.close()}
          type="button"
        >
          <ProductIcon name="close" />
        </button>
        {activeImage ? (
          <img alt={activeImage.alt || productName} src={activeImage.url} />
        ) : null}
      </dialog>
    </section>
  );
}
