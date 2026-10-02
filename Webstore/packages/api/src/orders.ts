import type { OrderStatus } from "@webstore/types/order";
import { DomainError } from "./errors.js";

const allowedTransitions: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["refund_requested"],
  cancelled: [],
  refund_requested: ["refunded"],
  refunded: [],
};

export const canTransitionOrder = (from: OrderStatus, to: OrderStatus): boolean =>
  allowedTransitions[from].includes(to);

export const assertOrderTransition = (from: OrderStatus, to: OrderStatus): void => {
  if (!canTransitionOrder(from, to)) {
    throw new DomainError(
      "INVALID_ORDER_TRANSITION",
      `Order status cannot transition from ${from} to ${to}.`,
    );
  }
};
