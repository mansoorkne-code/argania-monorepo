import { describe, expect, it } from "vitest";
import { DomainError } from "./errors.js";
import { calculateOrderTotals } from "./pricing.js";

const line = {
  variantId: "b12679eb-2f94-4a97-822a-8a1b06b8fb68",
  productId: "6afb5cb6-4a61-4f51-aa02-bdc3aa53c445",
  productName: "Premium Shirt",
  sku: "SHIRT-BLUE-M",
  variantName: "Blue / M",
  unitPriceMinor: 199_900,
  quantity: 2,
};

describe("calculateOrderTotals", () => {
  it("calculates totals from trusted server-side values", () => {
    expect(
      calculateOrderTotals({
        currency: "INR",
        lines: [line],
        discountMinor: 10_000,
        shippingMinor: 5_000,
        taxMinor: 71_982,
      }),
    ).toMatchObject({
      subtotalMinor: 399_800,
      totalMinor: 466_782,
      lines: [{ lineTotalMinor: 399_800 }],
    });
  });

  it("rejects a discount larger than the subtotal", () => {
    expect(() =>
      calculateOrderTotals({
        currency: "INR",
        lines: [line],
        discountMinor: 399_801,
      }),
    ).toThrow(DomainError);
  });
});
