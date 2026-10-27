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

export const checkoutAddressSchema = z.object({
  checkoutKey: z.uuid(),
  recipientName: z.string().trim().min(2).max(120),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/),
  line1: z.string().trim().min(3).max(240),
  line2: z.string().trim().max(240).optional().default(""),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().regex(/^\d{6}$/),
});

export type CheckoutAddressInput = z.infer<typeof checkoutAddressSchema>;
