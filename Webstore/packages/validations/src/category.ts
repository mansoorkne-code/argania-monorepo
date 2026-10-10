import { z } from "zod";

export const categoryIdSchema = z.uuid();
export const adminCategoryInputSchema = z.object({
  name: z.string().trim().min(1, "Category name is required.").max(180),
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
    .max(5000)
    .transform((value) => value || null),
  parentId: z
    .string()
    .trim()
    .pipe(z.union([z.literal(""), z.uuid()]))
    .transform((value) => value || null),
  status: z.enum(["draft", "active", "archived"]),
});
