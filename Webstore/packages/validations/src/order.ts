import { z } from "zod";
import { ORDER_STATUSES } from "@webstore/types/order";

export const orderIdSchema = z.uuid();

export const orderStatusUpdateInputSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(1_000).optional(),
});

export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateInputSchema>;
