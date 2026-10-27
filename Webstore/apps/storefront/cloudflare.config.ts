import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "argania-storefront",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-10-19",
    compatibilityFlags: ["nodejs_compat"],
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      NEXT_PUBLIC_SUPABASE_URL: bindings.secret(),
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: bindings.secret(),
      NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET: bindings.secret(),
      SUPABASE_SECRET_KEY: bindings.secret(),
      NEXT_PUBLIC_RAZORPAY_KEY_ID: bindings.secret(),
      RAZORPAY_KEY_SECRET: bindings.secret(),
      SHIPROCKET_API_EMAIL: bindings.secret(),
      SHIPROCKET_API_PASSWORD: bindings.secret(),
      SHIPROCKET_PICKUP_PINCODE: bindings.secret(),
      SHIPROCKET_PACKAGING_WEIGHT_KG: bindings.secret(),
      SHIPROCKET_PARCEL_LENGTH_CM: bindings.secret(),
      SHIPROCKET_PARCEL_BREADTH_CM: bindings.secret(),
      SHIPROCKET_PARCEL_HEIGHT_CM: bindings.secret(),
    },
  }),
});
