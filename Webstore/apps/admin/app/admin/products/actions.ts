"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminProductInputSchema } from "@webstore/validations/product";
import type { ProductFormState } from "../../../lib/product-form-state";
import { requireProductAdmin } from "../../../lib/product-access";

function stringField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function readProductForm(formData: FormData) {
  return {
    name: stringField(formData, "name"),
    slug: stringField(formData, "slug"),
    description: stringField(formData, "description"),
    categoryId: stringField(formData, "categoryId"),
    status: stringField(formData, "status"),
    sku: stringField(formData, "sku"),
    variantName: stringField(formData, "variantName"),
    price: stringField(formData, "price"),
    compareAtPrice: stringField(formData, "compareAtPrice"),
    stockQuantity: stringField(formData, "stockQuantity"),
    weightKg: stringField(formData, "weightKg"),
    variantActive: stringField(formData, "variantActive"),
    primaryVariantId: stringField(formData, "primaryVariantId"),
  };
}

function validationState(error: {
  issues: { path: PropertyKey[]; message: string }[];
}): ProductFormState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    fieldErrors[field] ??= issue.message;
  }
  return { fieldErrors };
}

function databaseState(error: {
  code?: string;
  message: string;
}): ProductFormState {
  if (error.code === "23505") {
    const field = error.message.toLowerCase().includes("sku") ? "sku" : "slug";
    return {
      fieldErrors: {
        [field]:
          field === "sku"
            ? "This SKU is already in use."
            : "This slug is already in use.",
      },
    };
  }
  if (error.code === "23503") {
    return { fieldErrors: { categoryId: "Choose an existing category." } };
  }
  return {
    formError:
      "The product could not be saved. Please review the fields and try again.",
  };
}

export async function createProductAction(
  _previousState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const supabase = await requireProductAdmin();
  const parsed = adminProductInputSchema.safeParse(readProductForm(formData));
  if (!parsed.success) return validationState(parsed.error);

  const input = parsed.data;
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      name: input.name,
      slug: input.slug,
      description: input.description,
      category_id: input.categoryId,
      status: input.status,
    })
    .select("id")
    .single();

  if (productError || !product) {
    return databaseState(
      productError ?? { message: "Product insert returned no row." },
    );
  }

  const { error: variantError } = await supabase
    .from("product_variants")
    .insert({
      product_id: product.id,
      sku: input.sku,
      name: input.variantName,
      attributes: {},
      price: input.price,
      compare_at_price: input.compareAtPrice,
      stock_quantity: input.stockQuantity,
      weight_kg: input.weightKg,
      is_active: input.variantActive,
    });

  if (variantError) {
    await supabase.from("products").delete().eq("id", product.id);
    return databaseState(variantError);
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin");
  redirect("/admin/products?notice=created");
}

export async function updateProductAction(
  productId: string,
  _previousState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const supabase = await requireProductAdmin();
  const parsed = adminProductInputSchema.safeParse(readProductForm(formData));
  if (!parsed.success) return validationState(parsed.error);

  const input = parsed.data;
  const { data: product, error: productError } = await supabase
    .from("products")
    .update({
      name: input.name,
      slug: input.slug,
      description: input.description,
      category_id: input.categoryId,
      status: input.status,
    })
    .eq("id", productId)
    .select("id")
    .maybeSingle();

  if (productError) return databaseState(productError);
  if (!product) return { formError: "This product no longer exists." };

  const variantValues = {
    product_id: product.id,
    sku: input.sku,
    name: input.variantName,
    attributes: {},
    price: input.price,
    compare_at_price: input.compareAtPrice,
    stock_quantity: input.stockQuantity,
    weight_kg: input.weightKg,
    is_active: input.variantActive,
  };

  const variantResult = input.primaryVariantId
    ? await supabase
        .from("product_variants")
        .update(variantValues)
        .eq("id", input.primaryVariantId)
        .eq("product_id", product.id)
        .select("id")
        .maybeSingle()
    : await supabase
        .from("product_variants")
        .insert(variantValues)
        .select("id")
        .single();

  if (variantResult.error) {
    return {
      ...databaseState(variantResult.error),
      formError:
        "Product details were saved, but its default variant could not be saved. Review the variant fields and try again.",
    };
  }
  if (!variantResult.data) {
    return {
      formError:
        "Product details were saved, but the default variant no longer exists.",
    };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath("/admin");
  redirect("/admin/products?notice=updated");
}

export async function archiveProductAction(
  productId: string,
  _formData: FormData,
) {
  const supabase = await requireProductAdmin();
  const { data, error } = await supabase
    .from("products")
    .update({ status: "archived" })
    .eq("id", productId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    redirect(`/admin/products?error=${error ? "archive-failed" : "not-found"}`);
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin");
  redirect("/admin/products?notice=archived");
}
