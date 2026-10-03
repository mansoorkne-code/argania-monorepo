import nextEnv from "@next/env";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(appRoot, "../..");
const { loadEnvConfig } = nextEnv;

// This monorepo keeps shared local environment files at Webstore/.env.
loadEnvConfig(workspaceRoot);

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
