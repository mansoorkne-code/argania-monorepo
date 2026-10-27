"use client";

import Link from "next/link";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import type { CartMutationResult, CartSnapshot } from "../../lib/cart-summary";
import { loadBag, removeBagItem, updateBagItem } from "./actions";
import styles from "./drawer.module.css";

type CartAction = (data: FormData) => Promise<CartMutationResult>;
type BagContext = {
  cart: CartSnapshot;
  openBag: () => void;
  busy: boolean;
  error: string;
  activeVariant: string | null;
  mutate: (action: CartAction, data: FormData, added?: boolean) => void;
};
const Context = createContext<BagContext | null>(null);
export function useBag() {
  const context = useContext(Context);
  if (!context) throw new Error("Bag controls require CartProvider.");
  return context;
}
const price = (minor: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    minor / 100,
  );

export function CartProvider({
  initialCart,
  children,
}: {
  initialCart: CartSnapshot;
  children: ReactNode;
}) {
  const [cart, setCart] = useState(initialCart);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeVariant, setActiveVariant] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();
  const dialog = useRef<HTMLDialogElement>(null);
  // Server navigation, login, checkout, and full-page cart mutations refresh it.
  useEffect(() => {
    setCart(initialCart);
  }, [initialCart]);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
    if (!open) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  function openBag() {
    setActiveVariant(null);
    setOpen(true);
    setError("");
    setNotice("");
    startTransition(async () => {
      try {
        setCart(await loadBag());
      } catch {
        setError("We couldn’t refresh your bag. Please try again.");
      }
    });
  }
  function mutate(action: CartAction, data: FormData, added = false) {
    setActiveVariant(added ? String(data.get("variantId")) : null);
    setError("");
    setNotice("");
    startTransition(async () => {
      try {
        const result = await action(data);
        if (!result) return;
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setCart(result.cart);
        setNotice(added ? "Added to your bag." : "Your bag has been updated.");
        if (added) setOpen(true);
      } catch (cause) {
        // Preserve framework navigation for customers who need to sign in.
        if (
          cause &&
          typeof cause === "object" &&
          "digest" in cause &&
          String(cause.digest).startsWith("NEXT_REDIRECT")
        )
          throw cause;
        setError("We couldn’t update your bag. Please try again.");
      }
    });
  }
  const close = () => setOpen(false);

  return (
    <Context.Provider
      value={{ cart, openBag, busy, error, activeVariant, mutate }}
    >
      {children}
      <dialog
        ref={dialog}
        id="shopping-bag"
        className={styles.drawer}
        aria-labelledby="bag-title"
        onCancel={close}
        onClose={close}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            const bounds = event.currentTarget.getBoundingClientRect();
            if (
              event.clientX < bounds.left ||
              event.clientX > bounds.right ||
              event.clientY < bounds.top ||
              event.clientY > bounds.bottom
            )
              close();
          }
        }}
      >
        <div className={styles.panel}>
          <header className={styles.header}>
            <div>
              <span className={styles.kicker}>YOUR ARGANIA BAG</span>
              <h2 id="bag-title">
                A few things for you. <span>({cart.count})</span>
              </h2>
            </div>
            <button
              type="button"
              className={styles.close}
              aria-label="Close shopping bag"
              onClick={close}
            >
              ×
            </button>
          </header>
          <div className={styles.feedback} aria-live="polite">
            {busy ? (
              <p role="status">Updating your bag…</p>
            ) : notice ? (
              <p role="status">{notice}</p>
            ) : null}
            {error || cart.error ? (
              <p role="alert" className={styles.error}>
                {error || cart.error}
              </p>
            ) : null}
            {cart.error ? (
              <button type="button" onClick={openBag} disabled={busy}>
                Try again
              </button>
            ) : null}
          </div>
          <div className={styles.contents} aria-busy={busy}>
            {!cart.signedIn ? (
              <div className={styles.empty}>
                <span aria-hidden="true">✳</span>
                <h3>Your next ritual awaits.</h3>
                <p>Sign in to view your bag and keep your favourites close.</p>
                <Link
                  href="/login?next=%2Fcart"
                  className={styles.primary}
                  onClick={close}
                >
                  Sign in
                </Link>
              </div>
            ) : !cart.items.length && !cart.error ? (
              <div className={styles.empty}>
                <span aria-hidden="true">✳</span>
                <h3>A little room for self-care.</h3>
                <p>
                  Your bag is empty. Find something lovely for your everyday
                  ritual.
                </p>
                <Link
                  href="/products"
                  className={styles.primary}
                  onClick={close}
                >
                  Explore the collection
                </Link>
              </div>
            ) : (
              <ul className={styles.items}>
                {cart.items.map((item) => (
                  <li key={item.id} className={styles.item}>
                    <div className={styles.image}>
                      {item.imagePath ? (
                        <img src={item.imagePath} alt={item.imageAlt} />
                      ) : (
                        <span aria-hidden="true">A</span>
                      )}
                    </div>
                    <div className={styles.details}>
                      <h3>
                        {item.slug ? (
                          <Link
                            href={`/products/${encodeURIComponent(item.slug)}`}
                            onClick={close}
                          >
                            {item.name}
                          </Link>
                        ) : (
                          item.name
                        )}
                      </h3>
                      <p>{item.option}</p>
                      <strong>{price(item.priceMinor * item.quantity)}</strong>
                      {!item.available ? (
                        <p className={styles.error}>No longer available</p>
                      ) : item.stock < item.quantity ? (
                        <p className={styles.error}>
                          Only {item.stock} available
                        </p>
                      ) : null}
                      <div className={styles.controls}>
                        <div
                          className={styles.quantity}
                          aria-label={`Quantity for ${item.name}`}
                        >
                          <button
                            type="button"
                            disabled={
                              busy || item.quantity <= 1 || !item.available
                            }
                            aria-label={`Decrease quantity of ${item.name}`}
                            onClick={() => {
                              const data = new FormData();
                              data.set("itemId", item.id);
                              data.set("quantity", String(item.quantity - 1));
                              mutate(updateBagItem, data);
                            }}
                          >
                            −
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            disabled={
                              busy ||
                              !item.available ||
                              item.quantity >= Math.min(item.stock, 100)
                            }
                            aria-label={`Increase quantity of ${item.name}`}
                            onClick={() => {
                              const data = new FormData();
                              data.set("itemId", item.id);
                              data.set("quantity", String(item.quantity + 1));
                              mutate(updateBagItem, data);
                            }}
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          className={styles.remove}
                          disabled={busy}
                          aria-label={`Remove ${item.name} from bag`}
                          onClick={() => {
                            const data = new FormData();
                            data.set("itemId", item.id);
                            mutate(removeBagItem, data);
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {cart.signedIn && cart.items.length > 0 ? (
            <footer className={styles.footer}>
              <div className={styles.subtotal}>
                <span>Subtotal</span>
                <strong>{price(cart.subtotalMinor)}</strong>
              </div>
              <p>
                Shipping and any applicable taxes are calculated at checkout.
              </p>
              {!cart.canCheckout ? (
                <p className={styles.error}>
                  Update or remove unavailable items before checkout.
                </p>
              ) : null}
              {cart.canCheckout && !busy ? (
                <Link
                  href="/checkout"
                  className={styles.primary}
                  onClick={close}
                >
                  Continue to checkout <span aria-hidden="true">↗</span>
                </Link>
              ) : (
                <button className={styles.primary} disabled>
                  Continue to checkout
                </button>
              )}
              <div className={styles.footerLinks}>
                <button type="button" onClick={close}>
                  Continue shopping
                </button>
                <Link href="/cart" onClick={close}>
                  View full bag
                </Link>
              </div>
            </footer>
          ) : null}
        </div>
      </dialog>
    </Context.Provider>
  );
}

export function CartButton() {
  const { cart, openBag } = useBag();
  return (
    <button
      type="button"
      onClick={openBag}
      className={`icon-button action-link ${styles.bagButton}`}
      aria-label={`Shopping bag, ${cart.count} ${cart.count === 1 ? "item" : "items"}`}
      aria-haspopup="dialog"
      aria-controls="shopping-bag"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 8h16l-1.1 12H5.1L4 8Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M9 9V6a3 3 0 0 1 6 0v3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <span className={styles.count} aria-hidden="true">
        {cart.count > 99 ? "99+" : cart.count}
      </span>
    </button>
  );
}
