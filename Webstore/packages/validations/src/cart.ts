import { z } from "zod";

export const variantIdSchema = z.uuid();

export const quantitySchema = z.number().int().positive().max(100);

export const cartItemInputSchema = z.object({
  variantId: variantIdSchema,
  quantity: quantitySchema,
});

export type CartItemInput = z.infer<typeof cartItemInputSchema>;
