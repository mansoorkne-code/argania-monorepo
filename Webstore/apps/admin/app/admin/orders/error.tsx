"use client";
import styles from "./orders.module.css";
export default function OrderError({ reset }: { reset: () => void }) {
  return (
    <div className={styles.page}>
      <h2>Unable to load orders</h2>
      <p>Please try again in a moment.</p>
      <button
        className="ui-button ui-button--primary ui-button--md"
        type="button"
        onClick={reset}
      >
        Try again
      </button>
    </div>
  );
}
