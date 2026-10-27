import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";

const appRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const workspaceRoot = path.resolve(appRoot, "../..");
const [command, ...args] = process.argv.slice(2);

if (
  !command ||
  !["dev", "build", "start", "typegen", "deploy"].includes(command)
) {
  throw new Error(
    "Expected a Vinext command: dev, build, start, typegen, or deploy.",
  );
}

// Load the shared environment before Vite compiles public configuration and
// before auth handlers or type generation evaluate the application's config.
nextEnv.loadEnvConfig(workspaceRoot, command === "dev");

const cli = ["dev", "build", "start"].includes(command)
  ? fileURLToPath(
      new URL("bin/vite.js", import.meta.resolve("vite/package.json")),
    )
  : command === "deploy"
    ? fileURLToPath(new URL("deploy-cloudflare.mjs", import.meta.url))
    : fileURLToPath(new URL("cli.js", import.meta.resolve("vinext")));
const child = spawn(
  process.execPath,
  [
    cli,
    ...(command === "deploy"
      ? []
      : [command === "start" ? "preview" : command]),
    ...args,
  ],
  {
    cwd: appRoot,
    env: process.env,
    stdio: "inherit",
  },
);

child.on("error", (error) => {
  console.error("Unable to start Vinext:", error);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exitCode = code ?? 1;
});
