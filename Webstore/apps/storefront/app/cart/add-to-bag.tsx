"use client";

import type { ReactNode } from "react";
import { addToBag } from "./actions";
import { useBag } from "./cart-provider";
import styles from "./drawer.module.css";

export function AddToBag({
  variantId,
  productSlug,
  className,
  buttonClassName,
  children = "Add to bag",
  quantity = 1,
  disabled = false,
}: {
  variantId: string;
  productSlug: string;
  className?: string;
  buttonClassName?: string;
  children?: ReactNode;
  quantity?: number;
  disabled?: boolean;
}) {
  const { mutate, busy, error, activeVariant } = useBag();
  return (
    <form className={className} action={(data) => mutate(addToBag, data, true)}>
      <input name="variantId" type="hidden" value={variantId} />
      <input name="productSlug" type="hidden" value={productSlug} />
      <input name="quantity" type="hidden" value={quantity} />
      <button
        className={buttonClassName}
        type="submit"
        disabled={busy || disabled}
      >
        {busy && activeVariant === variantId ? "Adding to bag…" : children}
      </button>
      {error && activeVariant === variantId ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
