import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "argania-admin",
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
    },
  }),
});
