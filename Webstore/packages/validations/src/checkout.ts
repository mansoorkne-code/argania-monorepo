import { z } from "zod";
import { cartItemInputSchema, variantIdSchema } from "./cart.js";

export const couponCodeSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/)
  .transform((value) => value.toUpperCase());

export const checkoutInputSchema = z.object({
  items: z.array(cartItemInputSchema).min(1).max(100),
  addressId: variantIdSchema,
  couponCode: couponCodeSchema.optional(),
});

export type CheckoutInput = z.infer<typeof checkoutInputSchema>;
