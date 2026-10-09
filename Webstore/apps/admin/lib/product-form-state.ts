export type ProductFormState = {
  formError?: string;
  fieldErrors?: Record<string, string>;
};

export type ProductFormAction = (
  previousState: ProductFormState,
  formData: FormData,
) => Promise<ProductFormState>;
