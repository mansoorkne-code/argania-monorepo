import { z } from "zod";
import { ORDER_STATUSES } from "@webstore/types/order";
export { orderIdSchema } from "@webstore/validations/order";

export const orderStatuses = ORDER_STATUSES;
export const paymentStatuses = [
  "pending",
  "authorized",
  "paid",
  "failed",
  "refunded",
  "partially_refunded",
  "cancelled",
] as const;
export const orderSorts = [
  "newest",
  "oldest",
  "total_desc",
  "total_asc",
  "number_desc",
  "number_asc",
] as const;
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date.")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return (
      Number.isFinite(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  }, "Use a valid date.");
export const adminOrderFiltersSchema = z
  .object({
    q: z.string().trim().max(100).default(""),
    status: z.enum(["", ...orderStatuses]).default(""),
    payment: z.enum(["", "none", ...paymentStatuses]).default(""),
    from: z.union([z.literal(""), date]).default(""),
    to: z.union([z.literal(""), date]).default(""),
    customer: z.string().trim().max(100).default(""),
    number: z
      .string()
      .trim()
      .regex(/^\d{1,19}$|^$/, "Enter a numeric order number.")
      .refine(
        (value) =>
          !value ||
          (/^\d{1,19}$/.test(value) && BigInt(value) <= 9223372036854775807n),
        "Order number is too large.",
      )
      .default(""),
    sort: z.enum(orderSorts).default("newest"),
    p: z.coerce.number().int().min(1).max(1000000).default(1),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: "Start date must be on or before end date.",
    path: ["to"],
  });
export type AdminOrderFilters = z.infer<typeof adminOrderFiltersSchema>;
