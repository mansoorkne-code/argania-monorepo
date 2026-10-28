"use client";

import { useRef, useState, useTransition } from "react";
import { quoteDelivery } from "./actions";
import styles from "./page.module.css";

type Quote = Awaited<ReturnType<typeof quoteDelivery>>;

export function DeliveryQuote() {
  const [postalCode, setPostalCode] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [pending, startTransition] = useTransition();
  const request = useRef(0);

  function checkDelivery() {
    const current = ++request.current;
    startTransition(async () => {
      const result = await quoteDelivery(postalCode).catch(() => ({
        ok: false as const,
        error: "Delivery pricing is temporarily unavailable. Please try again.",
      }));
      if (current === request.current) setQuote(result);
    });
  }

  return (
    <>
      <label>
        <span>PIN code</span>
        <input
          autoComplete="postal-code"
          inputMode="numeric"
          maxLength={6}
          minLength={6}
          name="postalCode"
          pattern="[0-9]{6}"
          required
          value={postalCode}
          onChange={(event) => {
            request.current += 1;
            setPostalCode(event.target.value.replace(/\D/g, "").slice(0, 6));
            setQuote(null);
          }}
        />
      </label>
      <div className={styles.deliveryNote}>
        <strong>Delivery charge</strong>
        <button
          className={styles.quoteButton}
          type="button"
          disabled={pending || postalCode.length !== 6}
          onClick={checkDelivery}
        >
          {pending ? "Checking delivery…" : "Check delivery charge"}
        </button>
        <span aria-live="polite" role="status">
          {quote?.ok
            ? `${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(quote.amount)} via ${quote.courierName}${quote.estimatedDays ? ` · estimated ${quote.estimatedDays} days` : ""}`
            : quote
              ? quote.error
              : "Enter your PIN code to check delivery before reviewing your order."}
        </span>
      </div>
    </>
  );
}
