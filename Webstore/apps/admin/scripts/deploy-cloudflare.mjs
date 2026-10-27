import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

// Called through with-workspace-env.mjs so the build and Worker receive the
// same configuration. Only admin variables are uploaded to Cloudflare.
const names = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET",
];

function run(cli, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cli, ...args], {
      stdio: "inherit",
      env: process.env,
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(
            `Cloudflare deployment command failed (${signal ?? code}).`,
          ),
        );
    });
  });
}

const vite = fileURLToPath(
  new URL("bin/vite.js", import.meta.resolve("vite/package.json")),
);
const cf = fileURLToPath(
  new URL("bin/cf", import.meta.resolve("cf/package.json")),
);
const args = process.argv.slice(2);
const skipBuild = args.includes("--prebuilt");
if (!skipBuild) await run(vite, ["build"]);

const directory = await mkdtemp(
  path.join(tmpdir(), "argania-admin-cloudflare-"),
);
try {
  const secretsFile = path.join(directory, "secrets.json");
  const secrets = Object.fromEntries(
    names
      .filter((name) => process.env[name]?.trim())
      .map((name) => [name, process.env[name]]),
  );
  await writeFile(secretsFile, JSON.stringify(secrets), { mode: 0o600 });
  await run(cf, [
    "deploy",
    "--prebuilt",
    "--secrets-file",
    secretsFile,
    ...args.filter((arg) => arg !== "--prebuilt"),
  ]);
} finally {
  await rm(directory, { recursive: true, force: true });
}
