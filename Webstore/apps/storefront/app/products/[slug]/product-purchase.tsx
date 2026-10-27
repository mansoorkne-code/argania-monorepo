"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { CatalogProduct } from "../../../lib/catalog";
import { formatPrice } from "../../../lib/money";
import { getProductDetails } from "../../../lib/product-details";
import { AddToBag } from "../../cart/add-to-bag";
import { ProductIcon } from "../../components/product-icon";
import styles from "./product.module.css";

export function ProductPurchase({
  product,
  cartError,
}: {
  product: CatalogProduct;
  cartError?: string;
}) {
  const [selectedId, setSelectedId] = useState(
    product.variants.find(
      (variant) => variant.stockQuantity > 0 && !variant.priceNeedsConfirmation,
    )?.id ?? product.variants[0]?.id,
  );
  const [quantity, setQuantity] = useState(1);
  const [purchaseVisible, setPurchaseVisible] = useState(false);
  const purchaseControls = useRef<HTMLElement>(null);
  const quantityId = useId();
  const selected =
    product.variants.find((variant) => variant.id === selectedId) ??
    product.variants[0];
  const selectedDetails = getProductDetails(product, selected);
  const limit = Math.max(1, Math.min(100, selected?.stockQuantity ?? 0));
  const currentQuantity = Math.min(quantity, limit);
  const available = Boolean(
    selected && selected.stockQuantity > 0 && !selected.priceNeedsConfirmation,
  );
  const price = selected
    ? selected.priceNeedsConfirmation
      ? "Price on request"
      : formatPrice(selected.price)
    : "Currently unavailable";
  const nameWords = product.name.split(" ");
  const accentWords = nameWords.length > 3 ? 2 : 1;
  const title = nameWords.slice(0, -accentWords).join(" ");
  const accent = nameWords.slice(-accentWords).join(" ");
  const stockLabel = selected?.priceNeedsConfirmation
    ? "Price coming soon"
    : available
      ? "In stock"
      : "Currently sold out";

  useEffect(() => {
    if (!purchaseControls.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setPurchaseVisible(entry?.isIntersecting ?? false),
      { rootMargin: "0px 0px -80px 0px" },
    );
    observer.observe(purchaseControls.current);
    return () => observer.disconnect();
  }, []);

  function changeVariant(id: string) {
    setSelectedId(id);
    setQuantity(1);
  }

  return (
    <>
      <section
        aria-label="Product information and purchase"
        className={styles.buy}
        data-purchase-visible={purchaseVisible}
        id="product-purchase"
        ref={purchaseControls}
      >
        <div className={styles.kicker}>
          <ProductIcon name="leaf" />
          <span>ARGANIA PROFESSIONAL</span>
          <span className={styles.label}>
            {product.category?.name ?? "Everyday care"}
          </span>
        </div>
        <h1>
          {title ? `${title} ` : ""}
          <em>{accent}</em>
        </h1>
        <p className={styles.buySub}>
          {selectedDetails.overview ||
            `Discover ${product.name}, part of the Argania Professional collection.`}
        </p>
        {selectedDetails.benefits.length ? (
          <div className={styles.miniTraits}>
            {selectedDetails.benefits.slice(0, 3).map((benefit) => (
              <span key={benefit}>
                <ProductIcon name="check" />
                {benefit.replace(/\.$/, "")}
              </span>
            ))}
          </div>
        ) : null}
        <div className={styles.rule} />
        <div className={styles.priceRow}>
          <div>
            <span className={styles.priceLabel}>YOUR EVERYDAY ESSENTIAL</span>
            <div className={styles.price} aria-live="polite">
              {price}
              {selected?.compareAtPrice &&
              selected.compareAtPrice > selected.price &&
              !selected.priceNeedsConfirmation ? (
                <s>{formatPrice(selected.compareAtPrice)}</s>
              ) : null}
            </div>
          </div>
          <span
            className={`${styles.stockTag} ${available ? styles.inStock : ""}`}
          >
            <span className={styles.stockDot} />
            {stockLabel}
          </span>
        </div>
        <p className={styles.priceSmall}>
          Delivery charges and available shipping options are calculated at
          checkout.
        </p>
        <fieldset className={styles.variantFieldset}>
          <legend className={styles.sizeLine}>
            CHOOSE YOUR SIZE{" "}
            <span>
              {product.variants.length}{" "}
              {product.variants.length === 1 ? "option" : "options"}
            </span>
          </legend>
          <div className={styles.sizes}>
            {product.variants.map((variant) => (
              <button
                aria-pressed={selected?.id === variant.id}
                className={
                  selected?.id === variant.id ? styles.selectedSize : ""
                }
                key={variant.id}
                onClick={() => changeVariant(variant.id)}
                type="button"
              >
                <span>
                  {variant.stockQuantity > 0 && !variant.priceNeedsConfirmation
                    ? "YOUR DAILY RITUAL"
                    : "CURRENTLY UNAVAILABLE"}
                </span>
                <strong>
                  {getProductDetails(product, variant).size ?? variant.name}
                </strong>
                <small>
                  {variant.priceNeedsConfirmation
                    ? "Price on request"
                    : formatPrice(variant.price)}
                </small>
              </button>
            ))}
          </div>
        </fieldset>
        <div className={styles.cartRow}>
          <div className={styles.qty}>
            <label className="sr-only" htmlFor={quantityId}>
              Quantity
            </label>
            <button
              aria-label="Decrease quantity"
              disabled={!available || currentQuantity <= 1}
              onClick={() => setQuantity(currentQuantity - 1)}
              type="button"
            >
              −
            </button>
            <input
              id={quantityId}
              aria-label="Quantity"
              type="number"
              min={1}
              max={limit}
              value={currentQuantity}
              disabled={!available}
              onChange={(event) =>
                setQuantity(
                  Math.min(
                    limit,
                    Math.max(
                      1,
                      Math.trunc(event.currentTarget.valueAsNumber) || 1,
                    ),
                  ),
                )
              }
            />
            <button
              aria-label="Increase quantity"
              disabled={!available || currentQuantity >= limit}
              onClick={() => setQuantity(currentQuantity + 1)}
              type="button"
            >
              +
            </button>
          </div>
          {selected ? (
            <AddToBag
              variantId={selected.id}
              productSlug={product.slug}
              quantity={currentQuantity}
              disabled={!available}
              className={styles.addForm}
              buttonClassName={styles.primaryCta}
            >
              {available ? "Add to bag" : "Currently unavailable"}
              <ProductIcon name="bag" />
            </AddToBag>
          ) : (
            <button className={styles.primaryCta} disabled>
              Currently unavailable
            </button>
          )}
        </div>
        <p className={styles.availability} aria-live="polite">
          {available
            ? `${selectedDetails.size ?? selected?.name ?? "Your selected option"} · Ready for your next ritual.`
            : "This option is currently unavailable. Explore another size or check back soon."}
        </p>
        {cartError ? (
          <p className={styles.cartError} role="alert">
            {cartError === "stock"
              ? "There isn’t enough stock for that quantity."
              : cartError === "unavailable"
                ? "This option is no longer available."
                : "We couldn’t add this item. Please try again."}
          </p>
        ) : null}
        <div className={styles.serviceCards}>
          <div>
            <ProductIcon name="shield" />
            <span>
              <strong>Shop with confidence</strong>
              <small>Secure checkout</small>
            </span>
          </div>
          <div>
            <ProductIcon name="truck" />
            <span>
              <strong>Delivered to your door</strong>
              <small>Options at checkout</small>
            </span>
          </div>
        </div>
        <div className={styles.shortAccordion}>
          <details open>
            <summary>
              About this essential<span aria-hidden="true">+</span>
            </summary>
            <div className={styles.acContent}>
              <p>{selectedDetails.overview || product.name}</p>
              <dl className={styles.specifications}>
                {selectedDetails.productType ? (
                  <div>
                    <dt>Product type</dt>
                    <dd>{selectedDetails.productType}</dd>
                  </div>
                ) : null}
                {selectedDetails.size ? (
                  <div>
                    <dt>Size</dt>
                    <dd>{selectedDetails.size}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Brand</dt>
                  <dd>{selectedDetails.brand ?? "Argania Professional"}</dd>
                </div>
              </dl>
            </div>
          </details>
          {selectedDetails.benefitsText ? (
            <details>
              <summary>
                Why you’ll love it<span aria-hidden="true">+</span>
              </summary>
              <div className={styles.acContent}>
                <p>{selectedDetails.benefitsText}</p>
              </div>
            </details>
          ) : null}
          {selectedDetails.ingredients ? (
            <details>
              <summary>
                Highlighted ingredients<span aria-hidden="true">+</span>
              </summary>
              <div className={styles.acContent}>
                <p>{selectedDetails.ingredients}</p>
                <p>See the packaging for the full ingredient list.</p>
              </div>
            </details>
          ) : null}
          {selectedDetails.usage.length ? (
            <details>
              <summary>
                How to use<span aria-hidden="true">+</span>
              </summary>
              <div className={styles.acContent}>
                <ol>
                  {selectedDetails.usage.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            </details>
          ) : null}
          <details>
            <summary>
              Delivery &amp; checkout<span aria-hidden="true">+</span>
            </summary>
            <div className={styles.acContent}>
              <p>
                Enter your delivery address at checkout to view shipping options
                and your order total before payment.
              </p>
            </div>
          </details>
        </div>
      </section>
      <div className={styles.stickyBar} aria-label="Quick purchase">
        <div className={`${styles.container} ${styles.stickyInner}`}>
          <div className={styles.stickyIdentity}>
            {product.images[0] ? (
              <img src={product.images[0].url} alt="" />
            ) : (
              <ProductIcon name="leaf" />
            )}
            <div>
              <b>{product.name}</b>
              <span>
                {selectedDetails.size ?? selected?.name} · {price}
              </span>
            </div>
          </div>
          <div className={styles.stickyActions}>
            <span>{available ? "YOUR RITUAL, READY" : stockLabel}</span>
            {selected ? (
              <AddToBag
                variantId={selected.id}
                productSlug={product.slug}
                quantity={currentQuantity}
                disabled={!available}
                className={styles.stickyForm}
                buttonClassName={styles.stickyCta}
              >
                {available ? "Add to bag" : "Unavailable"}
                <ProductIcon name="arrow" />
              </AddToBag>
            ) : (
              <a href="#product-purchase">View options</a>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
