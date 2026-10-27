import vinext from "vinext";
import { defineConfig } from "vite";
import { createHash } from "node:crypto";
import path from "node:path";
import { patchCssModules } from "vite-css-modules";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [
    patchCssModules({ exportMode: "default" }),
    vinext(),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  css: {
    modules: {
      generateScopedName(name: string, filename: string) {
        const relativePath = path
          .relative(import.meta.dirname, filename.replace(/\?.*$/, ""))
          .replaceAll("\\", "/");
        return `_${name}_${createHash("sha256").update(relativePath).digest("hex").slice(0, 7)}`;
      },
    },
  },
});
