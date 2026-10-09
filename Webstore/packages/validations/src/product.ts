import { z } from "zod";

const money = z
  .string()
  .trim()
  .regex(/^\d+(?:\.\d{1,2})?$/, "Enter an amount with up to two decimals.")
  .transform(Number)
  .refine((value) => Number.isFinite(value) && value <= 9_999_999_999.99, {
    message: "Amount exceeds the supported limit.",
  });

const optionalMoney = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .refine((value) => value === null || /^\d+(?:\.\d{1,2})?$/.test(value), {
    message: "Enter an amount with up to two decimals.",
  })
  .transform((value) => (value === null ? null : Number(value)))
  .refine((value) => value === null || value <= 9_999_999_999.99, {
    message: "Amount exceeds the supported limit.",
  });

const positiveWeight = z
  .string()
  .trim()
  .regex(/^\d+(?:\.\d{1,3})?$/, "Enter a weight with up to three decimals.")
  .transform(Number)
  .refine(
    (value) => Number.isFinite(value) && value > 0 && value <= 99_999.999,
    { message: "Weight must be greater than zero." },
  );

export const adminProductInputSchema = z
  .object({
    name: z.string().trim().min(1, "Product name is required.").max(180),
    slug: z
      .string()
      .trim()
      .min(1, "Slug is required.")
      .max(180)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Use lowercase letters, numbers, and single hyphens only.",
      ),
    description: z
      .string()
      .trim()
      .max(5_000, "Description must be 5,000 characters or fewer.")
      .transform((value) => value || null),
    categoryId: z
      .string()
      .trim()
      .pipe(z.union([z.literal(""), z.uuid()]))
      .transform((value) => value || null),
    status: z.enum(["draft", "active"]),
    sku: z
      .string()
      .trim()
      .min(1, "SKU is required.")
      .max(64)
      .regex(
        /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/,
        "Use letters, numbers, dots, _ or -.",
      ),
    variantName: z.string().trim().min(1, "Variant name is required.").max(120),
    price: money,
    compareAtPrice: optionalMoney,
    stockQuantity: z
      .string()
      .trim()
      .regex(/^\d+$/, "Stock must be a whole number.")
      .transform(Number)
      .refine(Number.isSafeInteger, "Stock must be a whole number.")
      .refine(
        (value) => value <= 2_147_483_647,
        "Stock exceeds the supported limit.",
      ),
    weightKg: positiveWeight,
    variantActive: z
      .enum(["true", "false"])
      .transform((value) => value === "true"),
    primaryVariantId: z
      .string()
      .trim()
      .pipe(z.union([z.literal(""), z.uuid()])),
  })
  .superRefine((value, context) => {
    if (value.compareAtPrice !== null && value.compareAtPrice < value.price) {
      context.addIssue({
        code: "custom",
        message: "Compare-at price must be at least the selling price.",
        path: ["compareAtPrice"],
      });
    }
  });

export type AdminProductInput = z.output<typeof adminProductInputSchema>;
