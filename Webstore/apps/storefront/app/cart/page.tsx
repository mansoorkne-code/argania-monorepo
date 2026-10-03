import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { EmptyState } from "@repo/ui/empty-state";
import { ErrorState } from "@repo/ui/error-state";
import { getOrCreateCart, type CartItemRecord } from "../../lib/cart";
import { formatPrice, getProductImageUrl } from "../../lib/catalog";
import { createClient } from "../../lib/supabase/server";
import { removeCartItem, updateCartItem } from "./actions";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Your bag | Argania",
  description: "Review the thoughtful essentials in your Argania bag.",
};

type CartPageProps = {
  searchParams: Promise<{ notice?: string; error?: string }>;
};

const noticeMessages: Record<string, string> = {
  added: "Added to your bag.",
  updated: "Your bag has been updated.",
  removed: "Item removed from your bag.",
};

const errorMessages: Record<string, string> = {
  invalid: "That cart update wasn’t valid. Please try again.",
  unavailable:
    "An item is no longer available. Remove it or try another option.",
  stock: "The requested quantity is higher than current stock.",
  save: "We couldn’t update your bag. Please try again.",
};

export default async function CartPage({ searchParams }: CartPageProps) {
  const { notice, error: errorCode } = await searchParams;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;

  if (typeof userId !== "string") {
    redirect("/login?next=%2Fcart");
  }

  let items: CartItemRecord[];
  try {
    const cartId = await getOrCreateCart(supabase, userId);
    const { data, error } = await supabase
      .from("cart_items")
      .select(
        `id, quantity, variant:product_variants(
          id, name, sku, price, stock_quantity, is_active,
          product:products(name, slug, status, product_images(storage_path, alt_text, position))
        )`,
      )
      .eq("cart_id", cartId)
      .order("created_at", { ascending: true });
    if (error) throw new Error("Cart items could not be loaded.");
    items = (data ?? []) as unknown as CartItemRecord[];
  } catch {
    return (
      <main className={styles.page}>
        <ErrorState
          className={styles.state}
          description="Please try again in a moment. If this continues, check that cart access is enabled for signed-in users."
          title="We couldn’t load your bag"
          action={<Link href="/products">Continue shopping</Link>}
        />
      </main>
    );
  }

  const subtotalMinor = items.reduce((total, item) => {
    if (!item.variant?.is_active || item.variant.product?.status !== "active") {
      return total;
    }
    return total + Math.round(Number(item.variant.price) * 100) * item.quantity;
  }, 0);
  const hasUnavailableItems = items.some((item) => {
    const variant = item.variant;
    return (
      !variant ||
      !variant.product ||
      !variant.is_active ||
      variant.product.status !== "active" ||
      variant.stock_quantity < item.quantity
    );
  });

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <span className={styles.kicker}>Your Argania bag</span>
        <h1>A few things for you.</h1>
        <p>
          Review your selections. Prices and availability reflect the current
          catalog.
        </p>
      </header>

      {noticeMessages[notice ?? ""] ? (
        <p className={styles.notice} role="status">
          {noticeMessages[notice ?? ""]}
        </p>
      ) : null}
      {errorMessages[errorCode ?? ""] ? (
        <p className={styles.errorMessage} role="alert">
          {errorMessages[errorCode ?? ""]}
        </p>
      ) : null}

      {!items.length ? (
        <EmptyState
          className={styles.state}
          description="Explore the collection and add something that makes an everyday moment feel special."
          title="Your bag is empty"
          action={<Link href="/products">Explore the collection</Link>}
        />
      ) : (
        <div className={styles.cartLayout}>
          <section aria-label="Items in your bag" className={styles.items}>
            {items.map((item) => {
              const variant = item.variant;
              const product = variant?.product;
              const available = Boolean(
                variant?.is_active && product?.status === "active",
              );
              const image = product?.product_images?.[0];
              const imageUrl = image
                ? getProductImageUrl(image.storage_path)
                : "";

              return (
                <Card className={styles.itemCard} key={item.id}>
                  <div
                    aria-label={
                      image?.alt_text || product?.name || "Product image"
                    }
                    className={styles.itemImage}
                    role="img"
                    style={
                      imageUrl
                        ? {
                            backgroundImage: `url(${JSON.stringify(imageUrl)})`,
                          }
                        : undefined
                    }
                  >
                    {!imageUrl ? <span aria-hidden="true">A</span> : null}
                  </div>
                  <div className={styles.itemDetails}>
                    <div className={styles.itemHeading}>
                      <div>
                        <h2>
                          {available && product ? (
                            <Link
                              href={`/products/${encodeURIComponent(product.slug)}`}
                            >
                              {product.name}
                            </Link>
                          ) : (
                            (product?.name ?? "Unavailable product")
                          )}
                        </h2>
                        <p>
                          {variant?.name ??
                            "This option is no longer available"}
                        </p>
                      </div>
                      {!available ? (
                        <Badge variant="warning">Unavailable</Badge>
                      ) : null}
                    </div>
                    {variant ? (
                      <div className={styles.itemPrice}>
                        <span>{formatPrice(Number(variant.price))}</span>
                        {variant.stock_quantity < item.quantity ? (
                          <span className={styles.stockWarning}>
                            Only {variant.stock_quantity} currently available
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                    {available && variant && variant.stock_quantity > 0 ? (
                      <form
                        action={updateCartItem}
                        className={styles.quantityForm}
                      >
                        <input name="itemId" type="hidden" value={item.id} />
                        <label>
                          <span>Quantity</span>
                          <input
                            aria-label={`Quantity for ${product?.name ?? "item"}`}
                            defaultValue={item.quantity}
                            max={Math.min(variant.stock_quantity, 100)}
                            min={1}
                            name="quantity"
                            type="number"
                          />
                        </label>
                        <Button size="sm" type="submit" variant="outline">
                          Update
                        </Button>
                      </form>
                    ) : null}
                    <form action={removeCartItem}>
                      <input name="itemId" type="hidden" value={item.id} />
                      <Button
                        className={styles.removeButton}
                        size="sm"
                        type="submit"
                        variant="ghost"
                      >
                        Remove
                      </Button>
                    </form>
                  </div>
                  <strong className={styles.lineTotal}>
                    {variant
                      ? formatPrice(
                          (Math.round(Number(variant.price) * 100) *
                            item.quantity) /
                            100,
                        )
                      : "—"}
                  </strong>
                </Card>
              );
            })}
          </section>

          <aside aria-label="Cart summary" className={styles.summary}>
            <h2>Summary</h2>
            <div>
              <span>Subtotal</span>
              <strong>{formatPrice(subtotalMinor / 100)}</strong>
            </div>
            <p>Shipping and any applicable taxes are calculated at checkout.</p>
            {hasUnavailableItems ? (
              <p className={styles.stockWarning}>
                Update or remove unavailable items before continuing.
              </p>
            ) : null}
            <Link
              className={`ui-button ui-button--primary ui-button--lg ${styles.checkoutButton}`}
              href="/checkout"
            >
              Continue to checkout
            </Link>
            <Link className={styles.continueLink} href="/products">
              Continue shopping
            </Link>
          </aside>
        </div>
      )}
    </main>
  );
}
