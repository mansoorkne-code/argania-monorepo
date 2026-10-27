import { orderLabel } from "../../../lib/order-data";
import styles from "./orders.module.css";

export function OrderStatus({ value }: { value: string }) {
  const tone = ["paid", "delivered", "confirmed"].includes(value)
    ? "good"
    : ["failed", "cancelled", "refunded"].includes(value)
      ? "muted"
      : "pending";
  return (
    <span className={styles.badge} data-tone={tone}>
      {orderLabel(value)}
    </span>
  );
}
