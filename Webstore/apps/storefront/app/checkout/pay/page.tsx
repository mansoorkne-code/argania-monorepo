import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Badge } from "@repo/ui/badge";
import { Card } from "@repo/ui/card";
import { ErrorState } from "@repo/ui/error-state";
import { formatPrice } from "../../../lib/catalog";
import { getRazorpayKeyId } from "../../../lib/checkout/razorpay";
import { createClient } from "../../../lib/supabase/server";
import { PaymentButton } from "../payment-button";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Review and pay | Argania",
  description: "Review your saved order and complete payment securely.",
};

type PayPageProps = { searchParams: Promise<{ order?: string }> };

export default async function PayPage({ searchParams }: PayPageProps) {
  const { order: orderId } = await searchParams;
  if (!orderId || !z.uuid().safeParse(orderId).success) redirect("/cart");

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (typeof userId !== "string") redirect(`/login?next=${encodeURIComponent(`/checkout/pay?order=${orderId}`)}`);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, order_number, status, currency, subtotal, shipping_total, total, shipping_address_snapshot, checkout_expires_at, shipping_courier_name")
    .eq("id", orderId)
    .eq("user_id", userId)
    .maybeSingle();
  if (orderError || !order) redirect("/cart?error=unavailable");
  if (order.status === "confirmed") redirect(`/checkout/success?order=${orderId}`);

  const { data: items } = await supabase
    .from("order_items")
    .select("product_name, variant_name, sku, unit_price, quantity")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });
  const { data: payment } = await supabase
    .from("payments")
    .select("provider_order_id, amount, currency, status")
    .eq("order_id", orderId)
    .eq("provider", "razorpay")
    .maybeSingle();

  const expired = !order.checkout_expires_at || Date.parse(order.checkout_expires_at) <= Date.now();
  const amountMinor = Math.round(Number(order.total) * 100);
  let keyId = "";
  try {
    keyId = getRazorpayKeyId();
  } catch {
    // Keep the saved order reviewable while the merchant finishes configuration.
  }

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <span className={styles.kicker}>Order #{order.order_number}</span>
        <h1>Review your order.</h1>
        <p>Your order is saved. Complete payment before the stock reservation expires.</p>
      </header>

      <div className={styles.layout}>
        <Card className={styles.orderCard}>
          <div className={styles.cardHeading}>
            <h2>Items</h2>
            <Badge variant="warning">Payment pending</Badge>
          </div>
          <ul className={styles.items}>
            {(items ?? []).map((item, index) => (
              <li key={`${item.sku}-${index}`}>
                <div>
                  <strong>{item.product_name}</strong>
                  <span>{item.variant_name} · {item.quantity} × {formatPrice(Number(item.unit_price))}</span>
                </div>
                <strong>{formatPrice((Math.round(Number(item.unit_price) * 100) * item.quantity) / 100)}</strong>
              </li>
            ))}
          </ul>
          <div className={styles.totals}>
            <p><span>Items subtotal</span><strong>{formatPrice(Number(order.subtotal))}</strong></p>
            <p><span>Delivery · {order.shipping_courier_name || "Shiprocket"}</span><strong>{formatPrice(Number(order.shipping_total))}</strong></p>
            <p className={styles.grandTotal}><span>Total due</span><strong>{formatPrice(Number(order.total))}</strong></p>
          </div>
          <section className={styles.address}>
            <h2>Delivering to</h2>
            <p>{order.shipping_address_snapshot.recipient_name}<br />
              {order.shipping_address_snapshot.line1}
              {order.shipping_address_snapshot.line2 ? `, ${order.shipping_address_snapshot.line2}` : ""}<br />
              {order.shipping_address_snapshot.city}, {order.shipping_address_snapshot.state} {order.shipping_address_snapshot.postal_code}<br />
              {order.shipping_address_snapshot.phone}
            </p>
          </section>
        </Card>

        <aside className={styles.paymentCard}>
          <h2>Secure payment</h2>
          {expired ? (
            <ErrorState
              description="The stock reservation ended. Start checkout again to refresh availability and delivery pricing."
              title="This payment window expired"
              action={<Link href="/checkout">Start checkout again</Link>}
            />
          ) : !payment?.provider_order_id ? (
            <ErrorState
              description="The payment reference is not available for this order yet. Return to checkout and try again."
              title="Payment is not ready"
              action={<Link href="/checkout">Return to checkout</Link>}
            />
          ) : !keyId ? (
            <ErrorState
              description="The store has not finished configuring its Razorpay keys. Your saved order remains available for 20 minutes."
              title="Payment setup is incomplete"
            />
          ) : (
            <PaymentButton
              amountMinor={amountMinor}
              keyId={keyId}
              orderId={order.id}
              providerOrderId={payment.provider_order_id}
            />
          )}
          <Link className={styles.backLink} href="/cart">Back to your bag</Link>
        </aside>
      </div>
    </main>
  );
}
