"use server";

import { redirect } from "next/navigation";
import { checkoutAddressSchema } from "@webstore/validations/checkout";
import { getOrCreateCart } from "../../lib/cart";
import {
  createRazorpayOrder,
  getRazorpayKeyId,
} from "../../lib/checkout/razorpay";
import {
  getParcelWeight,
  getShiprocketQuote,
} from "../../lib/checkout/shiprocket";
import { createClient } from "../../lib/supabase/server";
import { createServiceClient } from "../../lib/supabase/service";

type CheckoutCartItem = {
  quantity: number;
  variant: {
    id: string;
    name: string;
    sku: string;
    price: number | string;
    stock_quantity: number;
    weight_kg: number | string;
    is_active: boolean;
    product: { name: string; status: string };
  };
};

function inspectKey(name: string, expectedPrefixes: string[] = []) {
  const value = process.env[name]?.trim();
  if (!value) return "MISSING";
  if (!expectedPrefixes.length) return `SET (length ${value.length})`;
  const format = expectedPrefixes.find((prefix) => value.startsWith(prefix));
  return `SET (length ${value.length}; ${format ? `format ${format}…` : "unrecognized format"})`;
}

function logCheckoutEnvironment() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  let supabaseHost = "MISSING";
  if (supabaseUrl) {
    try {
      supabaseHost = `SET (${new URL(supabaseUrl).host})`;
    } catch {
      supabaseHost = "SET (invalid URL format)";
    }
  }

  console.info("[checkout] Environment diagnostics (values redacted)", {
    NEXT_PUBLIC_SUPABASE_URL: supabaseHost,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: inspectKey(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      ["sb_publishable_", "eyJ"],
    ),
    SUPABASE_SECRET_KEY: inspectKey("SUPABASE_SECRET_KEY", ["sb_secret_"]),
    SUPABASE_SERVICE_ROLE_KEY: inspectKey("SUPABASE_SERVICE_ROLE_KEY", ["eyJ"]),
    NEXT_PUBLIC_RAZORPAY_KEY_ID: inspectKey("NEXT_PUBLIC_RAZORPAY_KEY_ID", [
      "rzp_test_",
      "rzp_live_",
    ]),
    RAZORPAY_KEY_SECRET: inspectKey("RAZORPAY_KEY_SECRET"),
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET?.trim()
      ? "SET (optional)"
      : "MISSING (optional)",
    SHIPROCKET_API_EMAIL: inspectKey("SHIPROCKET_API_EMAIL"),
    SHIPROCKET_API_PASSWORD: inspectKey("SHIPROCKET_API_PASSWORD"),
    SHIPROCKET_PICKUP_PINCODE: inspectKey("SHIPROCKET_PICKUP_PINCODE"),
    SHIPROCKET_PACKAGING_WEIGHT_KG: inspectKey(
      "SHIPROCKET_PACKAGING_WEIGHT_KG",
    ),
    SHIPROCKET_PARCEL_LENGTH_CM: inspectKey("SHIPROCKET_PARCEL_LENGTH_CM"),
    SHIPROCKET_PARCEL_BREADTH_CM: inspectKey("SHIPROCKET_PARCEL_BREADTH_CM"),
    SHIPROCKET_PARCEL_HEIGHT_CM: inspectKey("SHIPROCKET_PARCEL_HEIGHT_CM"),
  });
}

export async function prepareCheckout(formData: FormData) {
  logCheckoutEnvironment();
  const input = checkoutAddressSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!input.success) redirect("/checkout?error=address");

  const sessionClient = await createClient();
  const { data: claims } = await sessionClient.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (typeof userId !== "string") redirect("/login?next=%2Fcheckout");

  let errorCode = "setup";
  let orderId: string | null = null;
  let stage = "initialize cart";
  try {
    const cartId = await getOrCreateCart(sessionClient, userId);
    const serviceClient = createServiceClient();
    stage = "load cart items with the Supabase server key";
    const { data, error: cartError } = await serviceClient
      .from("cart_items")
      .select(
        `quantity, variant:product_variants!inner(
          id, name, sku, price, stock_quantity, weight_kg, is_active,
          product:products!inner(name, status)
        )`,
      )
      .eq("cart_id", cartId);
    if (cartError) {
      throw new Error("Cart could not be loaded.", { cause: cartError });
    }

    const items = (data ?? []) as unknown as CheckoutCartItem[];
    if (!items.length) {
      errorCode = "cart";
      throw new Error("Cart is empty.");
    }
    if (
      items.some(
        (item) =>
          !item.variant.is_active ||
          item.variant.product.status !== "active" ||
          item.variant.stock_quantity < item.quantity ||
          item.quantity > 100,
      )
    ) {
      errorCode = "stock";
      throw new Error("Some cart items are not available.");
    }

    const subtotalMinor = items.reduce(
      (subtotal, item) =>
        subtotal + Math.round(Number(item.variant.price) * 100) * item.quantity,
      0,
    );
    const weightKg = getParcelWeight(items);
    let quote;
    stage = "request Shiprocket delivery quote";
    try {
      quote = await getShiprocketQuote({
        deliveryPostalCode: input.data.postalCode,
        weightKg,
        declaredValueRupees: subtotalMinor / 100,
      });
    } catch (error) {
      errorCode = "shipping";
      throw new Error("Delivery quote failed.", { cause: error });
    }
    getRazorpayKeyId();

    const addressSnapshot = {
      recipient_name: input.data.recipientName,
      phone: input.data.phone,
      line1: input.data.line1,
      line2: input.data.line2 || null,
      city: input.data.city,
      state: input.data.state,
      postal_code: input.data.postalCode,
      country_code: "IN",
    };
    stage = "save pending order and reserve stock";
    const { data: createdId, error: createError } = await serviceClient.rpc(
      "create_checkout_order",
      {
        p_user_id: userId,
        p_checkout_key: input.data.checkoutKey,
        p_shipping_address_snapshot: addressSnapshot,
        p_shipping_total: quote.amount,
        p_shipping_quote_reference: quote.reference,
        p_shipping_courier_id: quote.courierId,
        p_shipping_courier_name: quote.courierName,
      },
    );
    if (createError || typeof createdId !== "string") {
      errorCode = "stock";
      throw new Error("Order could not be created.", { cause: createError });
    }
    orderId = createdId;

    const { data: order, error: orderError } = await serviceClient
      .from("orders")
      .select("id, order_number, total, currency")
      .eq("id", orderId)
      .eq("user_id", userId)
      .single();
    if (orderError || !order)
      throw new Error("Saved order could not be loaded.");

    const { data: savedPayment, error: paymentError } = await serviceClient
      .from("payments")
      .select("provider_order_id")
      .eq("order_id", orderId)
      .eq("provider", "razorpay")
      .maybeSingle();
    if (paymentError) throw new Error("Payment record could not be loaded.");

    stage = "create Razorpay payment order";
    if (!savedPayment?.provider_order_id) {
      const amountMinor = Math.round(Number(order.total) * 100);
      const razorpayOrder = await createRazorpayOrder({
        amountMinor,
        receipt: `argania-${order.order_number}`,
        localOrderId: order.id,
      });
      const { error: updatePaymentError } = await serviceClient
        .from("payments")
        .update({ provider_order_id: razorpayOrder.id })
        .eq("order_id", orderId)
        .eq("provider", "razorpay")
        .is("provider_order_id", null);
      if (updatePaymentError)
        throw new Error("Payment reference could not be saved.");
    }
  } catch (error) {
    const detail =
      error instanceof Error && error.cause !== undefined ? error.cause : error;
    const databaseError =
      detail && typeof detail === "object"
        ? (detail as { code?: unknown; message?: unknown })
        : null;
    console.error("[checkout] Checkout preparation failed", {
      stage,
      code:
        typeof databaseError?.code === "string"
          ? databaseError.code
          : undefined,
      message:
        typeof databaseError?.message === "string"
          ? databaseError.message
          : error instanceof Error
            ? error.message
            : "Unknown checkout error",
    });
    if (orderId) {
      try {
        const serviceClient = createServiceClient();
        await serviceClient.rpc("cancel_checkout_order", {
          p_order_id: orderId,
        });
      } catch {
        // Expiry cleanup in the checkout RPC releases a pending reservation.
      }
    }
    redirect(`/checkout?error=${errorCode}`);
  }

  redirect(`/checkout/pay?order=${encodeURIComponent(orderId ?? "")}`);
}

export async function quoteDelivery(postalCode: string) {
  const input = checkoutAddressSchema.shape.postalCode.safeParse(postalCode);
  if (!input.success)
    return {
      ok: false as const,
      error: "Enter a six-digit delivery PIN code.",
    };
  try {
    const supabase = await createClient();
    const { data: claims } = await supabase.auth.getClaims();
    const userId = claims?.claims?.sub;
    if (typeof userId !== "string")
      return {
        ok: false as const,
        error: "Please sign in again to check delivery.",
      };
    const cartId = await getOrCreateCart(supabase, userId);
    const service = createServiceClient();
    const { data, error } = await service
      .from("cart_items")
      .select("quantity, variant:product_variants!inner(price,weight_kg)")
      .eq("cart_id", cartId);
    if (error)
      throw new Error("Cart could not be loaded for delivery pricing.");
    const items = (data ?? []) as unknown as {
      quantity: number;
      variant: { price: number | string; weight_kg: number | string };
    }[];
    if (!items.length)
      return {
        ok: false as const,
        error: "Add an item to your bag to check delivery.",
      };
    const amountMinor = items.reduce(
      (total, item) =>
        total + Math.round(Number(item.variant.price) * 100) * item.quantity,
      0,
    );
    const quote = await getShiprocketQuote({
      deliveryPostalCode: input.data,
      weightKg: getParcelWeight(items),
      declaredValueRupees: amountMinor / 100,
    });
    return {
      ok: true as const,
      amount: quote.amount,
      courierName: quote.courierName,
      estimatedDays: quote.estimatedDays,
    };
  } catch (error) {
    console.error("[checkout] Delivery preview failed", {
      message:
        error instanceof Error ? error.message : "Unknown delivery error",
    });
    return {
      ok: false as const,
      error:
        "Delivery pricing is temporarily unavailable for this PIN code. Please try again.",
    };
  }
}
