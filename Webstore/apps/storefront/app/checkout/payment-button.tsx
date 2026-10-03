"use client";

import { useState } from "react";
import Script from "next/script";
import { Button } from "@repo/ui/button";
import styles from "./payment-button.module.css";

type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = {
  open: () => void;
  on: (event: string, handler: (response: unknown) => void) => void;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  theme: { color: string };
  handler: (response: RazorpaySuccess) => void;
  modal: { ondismiss: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export function PaymentButton({
  keyId,
  providerOrderId,
  amountMinor,
  orderId,
}: {
  keyId: string;
  providerOrderId: string;
  amountMinor: number;
  orderId: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [error, setError] = useState("");

  async function startPayment() {
    const Razorpay = window.Razorpay;
    if (!Razorpay) return;
    setBusy(true);
    setError("");

    const checkout = new Razorpay({
      key: keyId,
      amount: amountMinor,
      currency: "INR",
      name: "Argania",
      description: "Your Argania order",
      order_id: providerOrderId,
      theme: { color: "#626b4c" },
      handler: async (response) => {
        try {
          const result = await fetch("/api/checkout/verify-payment", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(response),
          });
          if (!result.ok) throw new Error("Payment verification failed.");
          window.location.assign(`/checkout/success?order=${encodeURIComponent(orderId)}`);
        } catch {
          setBusy(false);
          setVerificationPending(true);
          setError("We received a payment response and are waiting for confirmation. Refresh this page in a moment before trying another payment.");
        }
      },
      modal: {
        ondismiss: () => setBusy(false),
      },
    });

    checkout.on("payment.failed", () => {
      setBusy(false);
      setError("Payment wasn’t completed. Your reserved items remain available for a short time; you can retry.");
    });
    checkout.open();
  }

  return (
    <div className={styles.container}>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setLoaded(true)}
        onError={() => setError("Secure payment could not be loaded. Refresh the page and try again.")}
      />
      <Button
        className={styles.button}
        disabled={!loaded || busy || verificationPending}
        onClick={startPayment}
        size="lg"
        type="button"
      >
        {verificationPending ? "Waiting for payment confirmation…" : busy ? "Opening secure checkout…" : loaded ? "Pay securely with Razorpay" : "Loading secure payment…"}
      </Button>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <p className={styles.secureNote}>Payment details are entered securely in Razorpay Checkout.</p>
    </div>
  );
}
