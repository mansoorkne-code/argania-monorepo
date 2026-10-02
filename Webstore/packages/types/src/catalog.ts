export interface ProductVariantForPricing {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  variantName: string;
  unitPriceMinor: number;
  currency: string;
  availableQuantity: number;
  isActive: boolean;
}

export interface OrderLineInput {
  variantId: string;
  quantity: number;
}

export interface PricedOrderLine extends OrderLineInput {
  productId: string;
  productName: string;
  sku: string;
  variantName: string;
  unitPriceMinor: number;
}
