"use server";

import { redirect } from "next/navigation";
import { checkoutAddressSchema } from "@webstore/validations/checkout";
import { getOrCreateCart } from "../../lib/cart";
import { createRazorpayOrder, getRazorpayKeyId } from "../../lib/checkout/razorpay";
import { getParcelWeight, getShiprocketQuote } from "../../lib/checkout/shiprocket";
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

export async function prepareCheckout(formData: FormData) {
  const input = checkoutAddressSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!input.success) redirect("/checkout?error=address");

  const sessionClient = await createClient();
  const { data: claims } = await sessionClient.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (typeof userId !== "string") redirect("/login?next=%2Fcheckout");

  let errorCode = "setup";
  let orderId: string | null = null;
  try {
    const cartId = await getOrCreateCart(sessionClient, userId);
    const serviceClient = createServiceClient();
    const { data, error: cartError } = await serviceClient
      .from("cart_items")
      .select(
        `quantity, variant:product_variants!inner(
          id, name, sku, price, stock_quantity, weight_kg, is_active,
          product:products!inner(name, status)
        )`,
      )
      .eq("cart_id", cartId);
    if (cartError) throw new Error("Cart could not be loaded.");

    const items = (data ?? []) as unknown as CheckoutCartItem[];
    if (!items.length) {
      errorCode = "cart";
      throw new Error("Cart is empty.");
    }
    if (items.some((item) =>
      !item.variant.is_active ||
      item.variant.product.status !== "active" ||
      item.variant.stock_quantity < item.quantity ||
      item.quantity > 100
    )) {
      errorCode = "stock";
      throw new Error("Some cart items are not available.");
    }

    const subtotalMinor = items.reduce(
      (subtotal, item) => subtotal + Math.round(Number(item.variant.price) * 100) * item.quantity,
      0,
    );
    const weightKg = getParcelWeight(items);
    let quote;
    try {
      quote = await getShiprocketQuote({
        deliveryPostalCode: input.data.postalCode,
        weightKg,
        declaredValueRupees: subtotalMinor / 100,
      });
    } catch {
      errorCode = "shipping";
      throw new Error("Delivery quote failed.");
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
      throw new Error("Order could not be created.");
    }
    orderId = createdId;

    const { data: order, error: orderError } = await serviceClient
      .from("orders")
      .select("id, order_number, total, currency")
      .eq("id", orderId)
      .eq("user_id", userId)
      .single();
    if (orderError || !order) throw new Error("Saved order could not be loaded.");

    const { data: savedPayment, error: paymentError } = await serviceClient
      .from("payments")
      .select("provider_order_id")
      .eq("order_id", orderId)
      .eq("provider", "razorpay")
      .maybeSingle();
    if (paymentError) throw new Error("Payment record could not be loaded.");

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
      if (updatePaymentError) throw new Error("Payment reference could not be saved.");
    }
  } catch {
    if (orderId) {
      try {
        const serviceClient = createServiceClient();
        await serviceClient.rpc("cancel_checkout_order", { p_order_id: orderId });
      } catch {
        // Expiry cleanup in the checkout RPC releases a pending reservation.
      }
    }
    redirect(`/checkout?error=${errorCode}`);
  }

  redirect(`/checkout/pay?order=${encodeURIComponent(orderId ?? "")}`);
}
