import type { createClient } from "./supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export interface CartVariantRecord {
  id: string;
  name: string;
  sku: string;
  price: number | string;
  stock_quantity: number;
  is_active: boolean;
  product: {
    name: string;
    slug: string;
    status: string;
    product_images: {
      storage_path: string;
      alt_text: string | null;
      position: number;
    }[];
  } | null;
}

export interface CartItemRecord {
  id: string;
  quantity: number;
  variant: CartVariantRecord | null;
}

export async function ensureCustomerProfile(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) throw new Error("Unable to load the customer profile.");
  if (profile) return;

  const { error: insertError } = await supabase
    .from("profiles")
    .insert({ id: userId, role: "customer" });

  if (!insertError) return;
  if (insertError.code === "23505") return;
  throw new Error("Unable to initialize the customer profile.");
}

export async function getOrCreateCart(
  supabase: SupabaseClient,
  userId: string,
) {
  await ensureCustomerProfile(supabase, userId);

  const findCart = async () => {
    const { data, error } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw new Error("Unable to load the shopping cart.");
    return data?.id as string | undefined;
  };

  const existingCartId = await findCart();
  if (existingCartId) return existingCartId;

  const { data, error } = await supabase
    .from("carts")
    .insert({ user_id: userId })
    .select("id")
    .single();

  if (!error && data?.id) return data.id as string;
  if (error?.code === "23505") {
    const cartId = await findCart();
    if (cartId) return cartId;
  }

  throw new Error("Unable to create the shopping cart.");
}
