"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { quantitySchema, variantIdSchema } from "@webstore/validations/cart";
import { getOrCreateCart } from "../../lib/cart";
import { createClient } from "../../lib/supabase/server";

type AvailableVariant = {
  id: string;
  is_active: boolean;
  stock_quantity: number;
  product: { status: string };
};

async function requireCustomer(nextPath: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (typeof userId !== "string") {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return { supabase, userId };
}

function readVariantId(formData: FormData) {
  const parsed = variantIdSchema.safeParse(formData.get("variantId"));
  return parsed.success ? parsed.data : null;
}

async function getAvailableVariant(
  supabase: Awaited<ReturnType<typeof createClient>>,
  variantId: string,
) {
  const { data, error } = await supabase
    .from("product_variants")
    .select("id, is_active, stock_quantity, product:products!inner(status)")
    .eq("id", variantId)
    .maybeSingle();

  if (error || !data) return null;
  const variant = data as unknown as AvailableVariant;
  if (!variant.is_active || variant.product?.status !== "active") return null;
  return variant;
}

export async function addCartItem(formData: FormData) {
  const variantId = readVariantId(formData);
  const quantity = quantitySchema.safeParse(Number(formData.get("quantity")));
  const slugValue = formData.get("productSlug");
  const slug = typeof slugValue === "string" ? slugValue : "";
  if (!variantId || !quantity.success) redirect("/cart?error=invalid");

  const productPath = slug ? `/products/${encodeURIComponent(slug)}` : "/cart";
  const { supabase, userId } = await requireCustomer(productPath);

  let failure: string | null = null;
  try {
    const cartId = await getOrCreateCart(supabase, userId);
    const variant = await getAvailableVariant(supabase, variantId);
    if (!variant) {
      failure = "unavailable";
    } else {
      const { data: existing, error: existingError } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("cart_id", cartId)
        .eq("variant_id", variantId)
        .maybeSingle();
      if (existingError) throw new Error("Unable to read the cart item.");

      const nextQuantity = (existing?.quantity ?? 0) + quantity.data;
      if (nextQuantity > variant.stock_quantity || nextQuantity > 100) {
        failure = "stock";
      } else {
        const { error } = await supabase
          .from("cart_items")
          .upsert(
            { cart_id: cartId, variant_id: variantId, quantity: nextQuantity },
            { onConflict: "cart_id,variant_id" },
          );
        if (error) throw new Error("Unable to save the cart item.");
      }
    }
  } catch {
    failure = "save";
  }
  if (failure) redirect(`${productPath}?cart_error=${failure}`);

  revalidatePath("/cart");
  redirect("/cart?notice=added");
}

export async function updateCartItem(formData: FormData) {
  const itemIdValue = formData.get("itemId");
  const itemId =
    typeof itemIdValue === "string" &&
    variantIdSchema.safeParse(itemIdValue).success
      ? itemIdValue
      : null;
  const quantity = quantitySchema.safeParse(Number(formData.get("quantity")));
  if (!itemId || !quantity.success) redirect("/cart?error=invalid");

  const { supabase, userId } = await requireCustomer("/cart");
  let failure: string | null = null;
  try {
    const cartId = await getOrCreateCart(supabase, userId);
    const { data: item, error: itemError } = await supabase
      .from("cart_items")
      .select("variant_id")
      .eq("id", itemId)
      .eq("cart_id", cartId)
      .maybeSingle();
    if (itemError || !item) {
      failure = "unavailable";
    } else {
      const variant = await getAvailableVariant(supabase, item.variant_id);
      if (!variant) {
        failure = "unavailable";
      } else if (quantity.data > variant.stock_quantity) {
        failure = "stock";
      } else {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: quantity.data })
          .eq("id", itemId)
          .eq("cart_id", cartId);
        if (error) throw new Error("Unable to update the cart item.");
      }
    }
  } catch {
    failure = "save";
  }
  if (failure) redirect(`/cart?error=${failure}`);

  revalidatePath("/cart");
  redirect("/cart?notice=updated");
}

export async function removeCartItem(formData: FormData) {
  const itemIdValue = formData.get("itemId");
  const itemId =
    typeof itemIdValue === "string" &&
    variantIdSchema.safeParse(itemIdValue).success
      ? itemIdValue
      : null;
  if (!itemId) redirect("/cart?error=invalid");

  const { supabase, userId } = await requireCustomer("/cart");
  let failure = false;
  try {
    const cartId = await getOrCreateCart(supabase, userId);
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", itemId)
      .eq("cart_id", cartId);
    if (error) failure = true;
  } catch {
    failure = true;
  }
  if (failure) redirect("/cart?error=save");

  revalidatePath("/cart");
  redirect("/cart?notice=removed");
}
