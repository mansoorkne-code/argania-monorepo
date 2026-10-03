import { NextResponse, type NextRequest } from "next/server";
import {
  verifyWebhookSignature,
} from "../../../../lib/checkout/razorpay";
import { createServiceClient } from "../../../../lib/supabase/service";

type RazorpayWebhookPayment = {
  id?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
};

export async function POST(request: NextRequest) {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET?.trim()) {
    return NextResponse.json(
      { error: "Razorpay webhook is not configured." },
      { status: 503 },
    );
  }

  const signature = request.headers.get("x-razorpay-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });

  const rawBody = await request.text();
  try {
    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
    }

    const event = JSON.parse(rawBody) as {
      event?: string;
      payload?: { payment?: { entity?: RazorpayWebhookPayment } };
    };
    const providerPayment = event.payload?.payment?.entity;
    if (!providerPayment?.order_id || !providerPayment.id) {
      return NextResponse.json({ received: true });
    }

    const serviceClient = createServiceClient();
    const { data: payment, error } = await serviceClient
      .from("payments")
      .select("id, order_id, provider_order_id")
      .eq("provider", "razorpay")
      .eq("provider_order_id", providerPayment.order_id)
      .maybeSingle();
    if (error) return NextResponse.json({ error: "Payment record unavailable." }, { status: 500 });
    if (!payment) return NextResponse.json({ received: true });

    if (event.event === "payment.captured") {
      if (!providerPayment.amount || !providerPayment.currency) {
        return NextResponse.json({ error: "Payment details are incomplete." }, { status: 400 });
      }
      const { error: confirmError } = await serviceClient.rpc(
        "confirm_checkout_payment",
        {
          p_order_id: payment.order_id,
          p_provider_order_id: providerPayment.order_id,
          p_provider_payment_id: providerPayment.id,
          p_amount_minor: providerPayment.amount,
          p_currency: providerPayment.currency,
        },
      );
      if (confirmError) return NextResponse.json({ error: "Payment confirmation failed." }, { status: 500 });
    } else if (event.event === "payment.failed") {
      await serviceClient
        .from("payments")
        .update({ status: "failed" })
        .eq("id", payment.id)
        .eq("status", "pending");
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Webhook could not be processed." }, { status: 400 });
  }
}
