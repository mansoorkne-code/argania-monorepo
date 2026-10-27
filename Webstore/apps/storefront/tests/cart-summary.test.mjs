import assert from "node:assert/strict";
import test from "node:test";
import { summarizeCart } from "../lib/cart-summary.ts";

function record(overrides = {}) {
  return {
    id: "item-1",
    quantity: 2,
    variant: {
      id: "variant-1",
      name: "30 ml",
      sku: "OIL",
      price: "799.95",
      stock_quantity: 5,
      is_active: true,
      product: {
        name: "Face oil",
        slug: "face-oil",
        status: "active",
        product_images: [],
      },
    },
    ...overrides,
  };
}

test("counts units and computes INR subtotal in minor units", () => {
  const result = summarizeCart([
    record(),
    record({ id: "item-2", quantity: 3 }),
  ]);
  assert.equal(result.count, 5);
  assert.equal(result.subtotalMinor, 399975);
  assert.equal(result.canCheckout, true);
});

test("retains unavailable items in the bag count but excludes them from subtotal and blocks checkout", () => {
  const result = summarizeCart([
    record(),
    record({ id: "removed", quantity: 3, variant: null }),
  ]);
  assert.equal(result.count, 5);
  assert.equal(result.subtotalMinor, 159990);
  assert.equal(result.canCheckout, false);
  assert.equal(result.items[1].available, false);
});

test("stock reduction blocks checkout without silently changing customer quantities", () => {
  const result = summarizeCart([record({ quantity: 6 })]);
  assert.equal(result.canCheckout, false);
  assert.equal(result.count, 6);
});

test("an empty or signed-out bag cannot check out", () => {
  assert.equal(summarizeCart([]).canCheckout, false);
  assert.deepEqual(summarizeCart([], false), {
    signedIn: false,
    items: [],
    count: 0,
    subtotalMinor: 0,
    canCheckout: false,
  });
});
