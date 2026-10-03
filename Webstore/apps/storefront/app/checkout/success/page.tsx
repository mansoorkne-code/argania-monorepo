import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Badge } from "@repo/ui/badge";
import { Card } from "@repo/ui/card";
import { ErrorState } from "@repo/ui/error-state";
import { formatPrice } from "../../../lib/catalog";
import { createClient } from "../../../lib/supabase/server";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Order confirmation | Argania",
  description: "Your Argania order confirmation.",
};

type SuccessPageProps = { searchParams: Promise<{ order?: string }> };

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const { order: orderId } = await searchParams;
  if (!orderId || !z.uuid().safeParse(orderId).success) redirect("/account");

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (typeof userId !== "string") redirect("/login?next=%2Faccount");

  const { data: order, error } = await supabase
    .from("orders")
    .select("id, order_number, status, total, currency")
    .eq("id", orderId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !order) {
    return (
      <main className={styles.page}>
        <ErrorState
          className={styles.card}
          title="We couldn’t load your order confirmation"
          description="Your order remains saved. Check your account again shortly."
          action={<Link href="/account">Go to your account</Link>}
        />
      </main>
    );
  }

  const confirmed = order.status === "confirmed";
  return (
    <main className={styles.page}>
      <Card className={styles.card}>
        <Badge variant={confirmed ? "success" : "warning"}>
          {confirmed ? "Payment confirmed" : "Payment confirmation pending"}
        </Badge>
        <span className={styles.kicker}>Order #{order.order_number}</span>
        <h1>{confirmed ? "Thank you." : "We’re confirming your payment."}</h1>
        <p>
          {confirmed
            ? `Your order is saved. The total paid was ${formatPrice(Number(order.total))}.`
            : "Your order is saved. Razorpay is still confirming the payment; refresh this page shortly."}
        </p>
        <Link className={styles.link} href="/account">Go to your account</Link>
      </Card>
    </main>
  );
}
