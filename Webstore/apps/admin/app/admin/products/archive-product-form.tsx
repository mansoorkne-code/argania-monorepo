"use client";

import { archiveProductAction } from "./actions";
import styles from "./products.module.css";

export function ArchiveProductForm({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const action = archiveProductAction.bind(null, productId);

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Archive “${productName}”? It will no longer appear in the storefront.`,
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <button className={styles.archiveButton} type="submit">
        Archive
      </button>
    </form>
  );
}
