import type { PricedOrderLine } from "@webstore/types/catalog";
import type { CalculatedOrderLine, OrderTotals } from "@webstore/types/order";
import { DomainError } from "./errors.js";

export interface OrderPricingInput {
  currency: string;
  lines: readonly PricedOrderLine[];
  discountMinor?: number;
  shippingMinor?: number;
  taxMinor?: number;
}

const assertNonNegativeSafeInteger = (value: number, field: string): void => {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new DomainError("INVALID_ORDER_INPUT", `${field} must be a non-negative safe integer.`);
  }
};

export const calculateOrderTotals = (input: OrderPricingInput): OrderTotals => {
  if (!/^[A-Z]{3}$/.test(input.currency)) {
    throw new DomainError("INVALID_ORDER_INPUT", "Currency must be a three-letter uppercase code.");
  }

  if (input.lines.length === 0) {
    throw new DomainError("INVALID_ORDER_INPUT", "An order must contain at least one item.");
  }

  const lines: CalculatedOrderLine[] = input.lines.map((line) => {
    assertNonNegativeSafeInteger(line.unitPriceMinor, "Unit price");

    if (!Number.isSafeInteger(line.quantity) || line.quantity <= 0) {
      throw new DomainError("INVALID_ORDER_INPUT", "Quantity must be a positive safe integer.");
    }

    if (line.quantity > Number.MAX_SAFE_INTEGER / Math.max(line.unitPriceMinor, 1)) {
      throw new DomainError("INVALID_ORDER_INPUT", "Line total exceeds the supported monetary range.");
    }

    return {
      variantId: line.variantId,
      productId: line.productId,
      productName: line.productName,
      sku: line.sku,
      variantName: line.variantName,
      unitPriceMinor: line.unitPriceMinor,
      quantity: line.quantity,
      lineTotalMinor: line.unitPriceMinor * line.quantity,
    };
  });

  const subtotalMinor = lines.reduce((total, line) => total + line.lineTotalMinor, 0);
  assertNonNegativeSafeInteger(subtotalMinor, "Subtotal");

  const discountMinor = input.discountMinor ?? 0;
  const shippingMinor = input.shippingMinor ?? 0;
  const taxMinor = input.taxMinor ?? 0;
  assertNonNegativeSafeInteger(discountMinor, "Discount");
  assertNonNegativeSafeInteger(shippingMinor, "Shipping");
  assertNonNegativeSafeInteger(taxMinor, "Tax");

  if (discountMinor > subtotalMinor) {
    throw new DomainError("INVALID_ORDER_INPUT", "Discount cannot exceed the order subtotal.");
  }

  const totalMinor = subtotalMinor - discountMinor + shippingMinor + taxMinor;
  assertNonNegativeSafeInteger(totalMinor, "Order total");

  return {
    currency: input.currency,
    lines,
    subtotalMinor,
    discountMinor,
    shippingMinor,
    taxMinor,
    totalMinor,
  };
};
