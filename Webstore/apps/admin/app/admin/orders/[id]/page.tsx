import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ErrorState } from "@repo/ui/error-state";
import { createClient } from "../../../../lib/supabase/server";
import {
  getAdminOrder,
  formatOrderDate,
  formatOrderMoney,
  snapshotText,
} from "../../../../lib/order-data";
import { handleOrderAccessError } from "../../../../lib/order-access";
import { OrderStatus } from "../order-ui";
import styles from "../orders.module.css";

export const metadata: Metadata = { title: "Order details" };
export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await createClient();
  let order;
  try {
    order = await getAdminOrder(client, id);
  } catch (error) {
    handleOrderAccessError(error);
    return (
      <div className={styles.page}>
        <ErrorState
          title="Unable to load this order"
          description="Please try again in a moment."
          action={<Link href="/admin/orders">Back to orders</Link>}
        />
      </div>
    );
  }
  if (!order) notFound();
  const address = order.shipping_address_snapshot;
  const name = snapshotText(address, "recipient_name");
  const phone = snapshotText(address, "phone");
  const money = (amount: number | string) =>
    formatOrderMoney(amount, order.currency);
  return (
    <div className={styles.page}>
      <Link className={styles.backLink} href="/admin/orders">
        ← Back to orders
      </Link>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Order record</p>
          <h2>Order #{order.order_number}</h2>
          <p>Created {formatOrderDate(order.created_at)} IST</p>
        </div>
        <OrderStatus value={order.status} />
      </header>
      <div className={styles.detailGrid}>
        <div className={styles.stack}>
          <section className={styles.card}>
            <h3>Order items</h3>
            <p className={styles.hint}>
              Names, SKUs and prices recorded at checkout.
            </p>
            {order.items.length ? (
              <div className={styles.tableFrame}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">Item</th>
                      <th scope="col">Unit price</th>
                      <th scope="col">Quantity</th>
                      <th scope="col">Line total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.product_name}</strong>
                          <small>
                            {item.variant_name} · SKU: {item.sku}
                          </small>
                        </td>
                        <td>{money(item.unit_price)}</td>
                        <td>{item.quantity}</td>
                        <td>{money(item.line_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No order items recorded.</p>
            )}
          </section>
          <section className={styles.card}>
            <h3>Payment information</h3>
            {!order.payments.length ? (
              <p>No payment records for this order.</p>
            ) : (
              <div className={styles.stack}>
                {order.payments.map((payment) => (
                  <article className={styles.payment} key={payment.id}>
                    <div className={styles.paymentHeader}>
                      <strong>{payment.provider}</strong>
                      <OrderStatus value={payment.status} />
                    </div>
                    <dl className={styles.facts}>
                      <div>
                        <dt>Amount</dt>
                        <dd>
                          {formatOrderMoney(payment.amount, payment.currency)}
                        </dd>
                      </div>
                      <div>
                        <dt>Provider order ID</dt>
                        <dd>{payment.provider_order_id || "Not recorded"}</dd>
                      </div>
                      <div>
                        <dt>Provider payment ID</dt>
                        <dd>{payment.provider_payment_id || "Not recorded"}</dd>
                      </div>
                      <div>
                        <dt>Created (IST)</dt>
                        <dd>{formatOrderDate(payment.created_at)}</dd>
                      </div>
                      <div>
                        <dt>Paid at (IST)</dt>
                        <dd>{formatOrderDate(payment.paid_at)}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
        <aside className={styles.stack}>
          <section className={styles.card}>
            <h3>Customer information</h3>
            <dl className={styles.facts}>
              <div>
                <dt>Name</dt>
                <dd>{order.customer.full_name || name || "Not recorded"}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{order.customer.phone || phone || "Not recorded"}</dd>
              </div>
              <div>
                <dt>Customer ID</dt>
                <dd>{order.user_id || "Account deleted"}</dd>
              </div>
            </dl>
            <p className={styles.hint}>
              Current profile information where available. The shipping record
              below is preserved separately.
            </p>
          </section>
          <section className={styles.card}>
            <h3>Shipping address snapshot</h3>
            <p className={styles.snapshotLabel}>Saved with this order</p>
            <address className={styles.address}>
              {[
                name,
                snapshotText(address, "line1"),
                snapshotText(address, "line2"),
                [snapshotText(address, "city"), snapshotText(address, "state")]
                  .filter(Boolean)
                  .join(", "),
                snapshotText(address, "postal_code"),
                snapshotText(address, "country_code"),
              ]
                .filter(Boolean)
                .map((line, index) => (
                  <span key={index}>{line}</span>
                ))}
            </address>
            {phone ? <p>Phone: {phone}</p> : null}
            {!Object.keys(address).length ? (
              <p>No shipping address recorded.</p>
            ) : null}
            {order.shipping_provider ? (
              <p className={styles.hint}>
                Carrier: {order.shipping_provider}
                {order.shipping_courier_name
                  ? ` · ${order.shipping_courier_name}`
                  : ""}
              </p>
            ) : null}
          </section>
          <section className={styles.card}>
            <h3>Order totals</h3>
            <dl className={styles.totals}>
              <div>
                <dt>Subtotal</dt>
                <dd>{money(order.subtotal)}</dd>
              </div>
              <div>
                <dt>Discount</dt>
                <dd>−{money(order.discount_total)}</dd>
              </div>
              <div>
                <dt>Shipping</dt>
                <dd>{money(order.shipping_total)}</dd>
              </div>
              <div>
                <dt>Tax</dt>
                <dd>{money(order.tax_total)}</dd>
              </div>
              <div className={styles.grandTotal}>
                <dt>Total</dt>
                <dd>{money(order.total)}</dd>
              </div>
            </dl>
            <p className={styles.hint}>
              Stored order totals · {order.currency}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
