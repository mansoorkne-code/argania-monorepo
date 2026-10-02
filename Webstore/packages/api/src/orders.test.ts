import { describe, expect, it } from "vitest";
import { DomainError } from "./errors.js";
import { assertOrderTransition, canTransitionOrder } from "./orders.js";

describe("order status transitions", () => {
  it("permits the documented lifecycle", () => {
    expect(canTransitionOrder("pending", "confirmed")).toBe(true);
    expect(canTransitionOrder("delivered", "refund_requested")).toBe(true);
  });

  it("rejects skipped and terminal transitions", () => {
    expect(canTransitionOrder("pending", "shipped")).toBe(false);
    expect(() => assertOrderTransition("cancelled", "confirmed")).toThrow(DomainError);
  });
});
