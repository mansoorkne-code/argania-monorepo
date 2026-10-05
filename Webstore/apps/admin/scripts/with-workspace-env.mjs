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

if (!command || !["dev", "build", "start"].includes(command)) {
  throw new Error("Expected a Next.js command: dev, build, or start.");
}

nextEnv.loadEnvConfig(workspaceRoot, command === "dev");

const nextBin = path.resolve(appRoot, "node_modules/next/dist/bin/next");
const next = spawn(process.execPath, [nextBin, command, ...args], {
  cwd: appRoot,
  env: process.env,
  stdio: "inherit",
});

next.on("error", (error) => {
  console.error("Unable to start Next.js:", error);
  process.exitCode = 1;
});

next.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exitCode = code ?? 1;
});
