import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isSameOriginRequest } from "../../../../lib/auth/request";
import {
  captureRazorpayPayment,
  fetchRazorpayPayment,
  verifyCheckoutSignature,
} from "../../../../lib/checkout/razorpay";
import { createClient } from "../../../../lib/supabase/server";
import { createServiceClient } from "../../../../lib/supabase/service";

const callbackSchema = z.object({
  razorpay_order_id: z.string().regex(/^order_[A-Za-z0-9]+$/),
  razorpay_payment_id: z.string().regex(/^pay_[A-Za-z0-9]+$/),
  razorpay_signature: z.string().regex(/^[a-f\d]{64}$/i),
});

function invalidPayment() {
  return NextResponse.json(
    { error: "Payment could not be verified." },
    { status: 400 },
  );
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "A same-origin request is required." }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (typeof userId !== "string") {
    return NextResponse.json({ error: "Sign in to verify payment." }, { status: 401 });
  }

  const input = callbackSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return invalidPayment();

  try {
    if (!verifyCheckoutSignature({
      orderId: input.data.razorpay_order_id,
      paymentId: input.data.razorpay_payment_id,
      signature: input.data.razorpay_signature,
    })) return invalidPayment();

    const serviceClient = createServiceClient();
    const { data: payment, error: paymentError } = await serviceClient
      .from("payments")
      .select("id, order_id, provider_order_id, amount, currency")
      .eq("provider", "razorpay")
      .eq("provider_order_id", input.data.razorpay_order_id)
      .maybeSingle();
    if (paymentError || !payment) return invalidPayment();

    const { data: order, error: orderError } = await serviceClient
      .from("orders")
      .select("id, user_id, total, currency, status")
      .eq("id", payment.order_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (orderError || !order || !["pending", "confirmed"].includes(order.status)) return invalidPayment();

    const amountMinor = Math.round(Number(order.total) * 100);
    if (Math.round(Number(payment.amount) * 100) !== amountMinor) return invalidPayment();

    let verified = await fetchRazorpayPayment(input.data.razorpay_payment_id);
    if (
      verified.order_id !== input.data.razorpay_order_id ||
      verified.amount !== amountMinor ||
      verified.currency !== order.currency
    ) return invalidPayment();

    if (verified.status === "authorized") {
      verified = await captureRazorpayPayment(verified.id, amountMinor);
    }
    if (verified.status !== "captured") return invalidPayment();

    const { error: confirmationError } = await serviceClient.rpc(
      "confirm_checkout_payment",
      {
        p_order_id: order.id,
        p_provider_order_id: verified.order_id,
        p_provider_payment_id: verified.id,
        p_amount_minor: verified.amount,
        p_currency: verified.currency,
      },
    );
    if (confirmationError) return invalidPayment();

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Payment verification is temporarily unavailable." },
      { status: 503 },
    );
  }
}
