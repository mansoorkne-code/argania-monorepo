import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

function razorpayCredentials() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) throw new Error("Razorpay API credentials are not configured.");
  return { keyId, keySecret };
}

function authorizationHeader(keyId: string, keySecret: string) {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

export function getRazorpayKeyId() {
  return razorpayCredentials().keyId;
}

export async function createRazorpayOrder(input: {
  amountMinor: number;
  receipt: string;
  localOrderId: string;
}) {
  const { keyId, keySecret } = razorpayCredentials();
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      authorization: authorizationHeader(keyId, keySecret),
      "content-type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amountMinor,
      currency: "INR",
      receipt: input.receipt.slice(0, 40),
      notes: { argania_order_id: input.localOrderId },
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error("Razorpay order creation failed.");

  const body = (await response.json()) as {
    id?: string;
    amount?: number;
    currency?: string;
  };
  if (typeof body.id !== "string" || body.amount !== input.amountMinor || body.currency !== "INR") {
    throw new Error("Razorpay returned an unexpected order.");
  }
  return { id: body.id, amount: body.amount, currency: body.currency };
}

export function verifyCheckoutSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const { keySecret } = razorpayCredentials();
  const expected = createHmac("sha256", keySecret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest();
  return safeHexSignature(expected, input.signature);
}

export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret) throw new Error("RAZORPAY_WEBHOOK_SECRET is not configured.");
  const expected = createHmac("sha256", secret).update(rawBody).digest();
  return safeHexSignature(expected, signature);
}

function safeHexSignature(expected: Buffer, candidate: string) {
  if (!/^[a-f\d]{64}$/i.test(candidate)) return false;
  const received = Buffer.from(candidate, "hex");
  return received.length === expected.length && timingSafeEqual(expected, received);
}

export interface RazorpayPayment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
}

export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPayment> {
  const { keyId, keySecret } = razorpayCredentials();
  const response = await fetch(
    `https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`,
    {
      headers: { authorization: authorizationHeader(keyId, keySecret) },
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    },
  );
  if (!response.ok) throw new Error("Razorpay payment could not be verified.");
  return (await response.json()) as RazorpayPayment;
}

export async function captureRazorpayPayment(paymentId: string, amountMinor: number) {
  const { keyId, keySecret } = razorpayCredentials();
  const response = await fetch(
    `https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/capture`,
    {
      method: "POST",
      headers: {
        authorization: authorizationHeader(keyId, keySecret),
        "content-type": "application/json",
      },
      body: JSON.stringify({ amount: amountMinor, currency: "INR" }),
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    },
  );
  if (!response.ok) throw new Error("Razorpay could not capture the payment.");
  return (await response.json()) as RazorpayPayment;
}
