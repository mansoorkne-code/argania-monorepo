import "server-only";
import { createClient } from "./supabase/server";
import type { CartItemRecord } from "./cart";
import { getProductImageUrl } from "./catalog";
import { summarizeCart, type CartSnapshot } from "./cart-summary";

// Reading the header must not create carts or customer profiles.
export async function getCartSnapshot(): Promise<CartSnapshot> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (typeof userId !== "string") return summarizeCart([], false);

  try {
    const { data: cart, error: cartError } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (cartError) throw cartError;
    if (!cart) return summarizeCart([]);
    const { data: items, error } = await supabase
      .from("cart_items")
      .select(
        `id, quantity, variant:product_variants(
        id, name, sku, price, stock_quantity, is_active,
        product:products(name, slug, status, product_images(storage_path, alt_text, position))
      )`,
      )
      .eq("cart_id", cart.id)
      .order("created_at", { ascending: true });
    if (error) throw error;
    const summary = summarizeCart((items ?? []) as unknown as CartItemRecord[]);
    return {
      ...summary,
      items: summary.items.map((item) => ({
        ...item,
        imagePath: item.imagePath ? getProductImageUrl(item.imagePath) : null,
      })),
    };
  } catch {
    return {
      ...summarizeCart([]),
      error: "We couldn’t load your bag. Please try again.",
    };
  }
}
