import type { Metadata } from "next";
import Link from "next/link";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { EmptyState } from "@repo/ui/empty-state";
import { ErrorState } from "@repo/ui/error-state";
import { getOrCreateCart } from "../../lib/cart";
import { formatPrice } from "../../lib/catalog";
import { createClient } from "../../lib/supabase/server";
import { prepareCheckout } from "./actions";
import { DeliveryQuote } from "./delivery-quote";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Delivery details | Argania",
  description: "Enter your delivery details to review shipping and payment.",
};

type CheckoutItem = {
  id: string;
  quantity: number;
  variant: {
    name: string;
    price: number | string;
    product: { name: string };
  } | null;
};

type CheckoutPageProps = { searchParams: Promise<{ error?: string }> };

const errors: Record<string, string> = {
  address:
    "Check the delivery details and enter a valid Indian PIN code and phone number.",
  cart: "Your bag is empty. Add an item before checkout.",
  stock:
    "Some items are unavailable or no longer have enough stock. Update your bag and try again.",
  shipping:
    "We couldn’t calculate delivery for that address. Check the PIN code or try again later.",
  setup: "Checkout could not start. Please try again or contact the store.",
};

export default async function CheckoutPage({
  searchParams,
}: CheckoutPageProps) {
  const { error: errorCode } = await searchParams;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (typeof userId !== "string") redirect("/login?next=%2Fcheckout");

  let items: CheckoutItem[];
  try {
    const cartId = await getOrCreateCart(supabase, userId);
    const { data, error } = await supabase
      .from("cart_items")
      .select(
        "id, quantity, variant:product_variants(name, price, product:products(name))",
      )
      .eq("cart_id", cartId)
      .order("created_at", { ascending: true });
    if (error) throw new Error("Could not load cart contents.");
    items = (data ?? []) as unknown as CheckoutItem[];
  } catch {
    return (
      <main className={styles.page}>
        <ErrorState
          className={styles.state}
          description="Return to your bag and try again."
          title="Your bag couldn’t be loaded"
          action={<Link href="/cart">Back to your bag</Link>}
        />
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className={styles.page}>
        <EmptyState
          className={styles.state}
          description="Add a product to your bag before starting checkout."
          title="Your bag is empty"
          action={<Link href="/products">Explore the collection</Link>}
        />
      </main>
    );
  }

  const subtotalMinor = items.reduce(
    (sum, item) =>
      sum +
      (item.variant
        ? Math.round(Number(item.variant.price) * 100) * item.quantity
        : 0),
    0,
  );

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <span className={styles.kicker}>A considered delivery</span>
        <h1>Where should we send it?</h1>
        <p>
          We’ll calculate the delivery charge with Shiprocket, save your order,
          then open secure Razorpay checkout.
        </p>
      </header>

      {errors[errorCode ?? ""] ? (
        <p className={styles.error} role="alert">
          {errors[errorCode ?? ""]}
        </p>
      ) : null}

      <div className={styles.layout}>
        <Card className={styles.addressCard}>
          <h2>Delivery address</h2>
          <form action={prepareCheckout} className={styles.addressForm}>
            <input name="checkoutKey" type="hidden" value={randomUUID()} />
            <label>
              <span>Full name</span>
              <input
                autoComplete="name"
                maxLength={120}
                name="recipientName"
                required
              />
            </label>
            <label>
              <span>Mobile number</span>
              <input
                autoComplete="tel-national"
                inputMode="numeric"
                maxLength={10}
                minLength={10}
                name="phone"
                pattern="[6-9][0-9]{9}"
                required
              />
            </label>
            <label className={styles.fullField}>
              <span>Address</span>
              <input
                autoComplete="address-line1"
                maxLength={240}
                name="line1"
                required
              />
            </label>
            <label className={styles.fullField}>
              <span>Apartment, landmark (optional)</span>
              <input
                autoComplete="address-line2"
                maxLength={240}
                name="line2"
              />
            </label>
            <label>
              <span>City</span>
              <input
                autoComplete="address-level2"
                maxLength={100}
                name="city"
                required
              />
            </label>
            <label>
              <span>State</span>
              <input
                autoComplete="address-level1"
                maxLength={100}
                name="state"
                required
              />
            </label>
            <DeliveryQuote />
            <Button className={styles.submit} size="lg" type="submit">
              Review order and delivery
            </Button>
          </form>
        </Card>

        <aside className={styles.summary}>
          <h2>Your order</h2>
          <ul>
            {items.map((item) => (
              <li key={item.id}>
                <span>
                  {item.variant?.product?.name ?? "Unavailable product"} ·{" "}
                  {item.variant?.name ?? "Option unavailable"} × {item.quantity}
                </span>
                <strong>
                  {item.variant
                    ? formatPrice(
                        (Math.round(Number(item.variant.price) * 100) *
                          item.quantity) /
                          100,
                      )
                    : "—"}
                </strong>
              </li>
            ))}
          </ul>
          <div className={styles.subtotal}>
            <span>Items subtotal</span>
            <strong>{formatPrice(subtotalMinor / 100)}</strong>
          </div>
          <p>Final delivery charge and total appear before you pay.</p>
        </aside>
      </div>
    </main>
  );
}
