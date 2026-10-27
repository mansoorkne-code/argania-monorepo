import type { CartItemRecord } from "./cart";

export type BagItem = {
  id: string;
  name: string;
  slug: string | null;
  option: string;
  quantity: number;
  priceMinor: number;
  stock: number;
  available: boolean;
  imagePath: string | null;
  imageAlt: string;
};

export type CartSnapshot = {
  signedIn: boolean;
  items: BagItem[];
  count: number;
  subtotalMinor: number;
  canCheckout: boolean;
  error?: string;
};

export type CartMutationResult =
  { ok: true; cart: CartSnapshot } | { ok: false; error: string };

export function summarizeCart(
  records: CartItemRecord[],
  signedIn = true,
): CartSnapshot {
  const items = records.map((item): BagItem => {
    const variant = item.variant;
    const product = variant?.product;
    const image = product?.product_images
      ?.slice()
      .sort((a, b) => a.position - b.position)[0];
    return {
      id: item.id,
      name: product?.name ?? "Unavailable product",
      slug: product?.slug ?? null,
      option: variant?.name ?? "Unavailable option",
      quantity: item.quantity,
      priceMinor: Math.round(Number(variant?.price ?? 0) * 100),
      stock: variant?.stock_quantity ?? 0,
      available: Boolean(variant?.is_active && product?.status === "active"),
      imagePath: image?.storage_path ?? null,
      imageAlt: image?.alt_text ?? product?.name ?? "Product image",
    };
  });
  return {
    signedIn,
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotalMinor: items.reduce(
      (sum, item) =>
        sum + (item.available ? item.priceMinor * item.quantity : 0),
      0,
    ),
    canCheckout:
      items.length > 0 &&
      items.every((item) => item.available && item.stock >= item.quantity),
  };
}

export const cartErrors: Record<string, string> = {
  invalid: "That bag update wasn’t valid. Please try again.",
  unavailable:
    "This option is no longer available. Please remove it or choose another.",
  stock: "There isn’t enough stock for that quantity.",
  save: "We couldn’t update your bag. Please try again.",
};
