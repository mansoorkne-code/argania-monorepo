import type { SupabaseClient } from "@supabase/supabase-js";
import {
  adminOrderFiltersSchema,
  orderIdSchema,
  type AdminOrderFilters,
} from "@webstore/validations/orders";

export const orderPageSize = 20;
export class OrderAccessError extends Error {
  readonly status: 401 | 403;
  constructor(status: 401 | 403) {
    super(
      status === 401
        ? "Sign in to view orders."
        : "Only admins can view orders.",
    );
    this.status = status;
  }
}

// This guard runs on every read, independently of the parent layout.
export async function authorizeOrderRead(client: SupabaseClient) {
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) throw new OrderAccessError(401);
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError || profile?.role !== "admin")
    throw new OrderAccessError(403);
}
export type OrderListRow = {
  id: string;
  order_number: string;
  user_id: string | null;
  status: string;
  currency: string;
  total: string | number;
  created_at: string;
  customer_name: string | null;
  customer_phone: string | null;
  payment_statuses: string[];
};
export type OrderDetail = {
  id: string;
  order_number: string;
  user_id: string | null;
  status: string;
  currency: string;
  subtotal: string | number;
  discount_total: string | number;
  shipping_total: string | number;
  tax_total: string | number;
  total: string | number;
  created_at: string;
  placed_at: string | null;
  shipping_address_snapshot: Record<string, unknown>;
  shipping_provider: string | null;
  shipping_courier_name: string | null;
  customer: { full_name: string | null; phone: string | null };
  items: {
    id: string;
    product_name: string;
    variant_name: string;
    sku: string;
    quantity: number;
    unit_price: string | number;
    line_total: string | number;
  }[];
  payments: {
    id: string;
    provider: string;
    provider_order_id: string | null;
    provider_payment_id: string | null;
    amount: string | number;
    currency: string;
    status: string;
    paid_at: string | null;
    created_at: string;
  }[];
};
export async function getAdminOrders(
  client: SupabaseClient,
  input: AdminOrderFilters,
) {
  await authorizeOrderRead(client);
  const filters = adminOrderFiltersSchema.parse(input);
  const { data, error } = await client.rpc("admin_order_list", {
    p_search: filters.q,
    p_status: filters.status,
    p_payment: filters.payment,
    p_from: filters.from || null,
    p_to: filters.to || null,
    p_customer: filters.customer,
    p_number: filters.number,
    p_sort: filters.sort,
    p_page: filters.p,
  });
  if (error) throw new Error("Unable to load orders.", { cause: error });
  return data as { orders: OrderListRow[]; total_count: number };
}
export async function getAdminOrder(
  client: SupabaseClient,
  id: string,
): Promise<OrderDetail | null> {
  await authorizeOrderRead(client);
  if (!orderIdSchema.safeParse(id).success) return null;
  const { data, error } = await client.rpc("admin_order_detail", { p_id: id });
  if (error) throw new Error("Unable to load this order.", { cause: error });
  return data as OrderDetail | null;
}

export function orderPageHref(filters: AdminOrderFilters, page: number) {
  const query = new URLSearchParams();
  for (const key of [
    "q",
    "status",
    "payment",
    "from",
    "to",
    "customer",
    "number",
    "sort",
  ] as const) {
    const value = filters[key];
    if (value && !(key === "sort" && value === "newest")) query.set(key, value);
  }
  if (page > 1) query.set("p", String(page));
  return `/admin/orders${query.size ? `?${query}` : ""}`;
}
export function snapshotText(snapshot: Record<string, unknown>, key: string) {
  const value = snapshot[key];
  return typeof value === "string" ? value.trim() : "";
}
export function formatOrderMoney(value: string | number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(
    Number(value),
  );
}
export function formatOrderDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
}
export function orderLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
