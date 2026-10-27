import styles from "./orders.module.css";
export default function LoadingOrders() {
  return (
    <div className={styles.page} role="status" aria-live="polite">
      Loading order records…
    </div>
  );
}
