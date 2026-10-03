import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const envText = await readFile(new URL("../../.env", import.meta.url), "utf8").catch(() => "");
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((line) => line && !line.trimStart().startsWith("#") && line.includes("="))
    .map((line) => {
      const separator = line.indexOf("=");
      return [line.slice(0, separator).trim(), line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "")];
    }),
);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

assert.ok(supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL must be set in Webstore/.env or environment");
assert.ok(
  publishableKey,
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set in Webstore/.env or environment",
);

async function anonymousSelect(table) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=id&limit=1`, {
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
    },
  });
  const body = await response.text();
  let rows = null;
  try {
    const parsed = JSON.parse(body);
    rows = Array.isArray(parsed) ? parsed : null;
  } catch {
    // A non-JSON response is assessed from its HTTP status by the caller.
  }
  return { status: response.status, rows };
}

test("anonymous users can query the public catalog", async () => {
  for (const table of ["categories", "products", "product_variants", "product_images"]) {
    const result = await anonymousSelect(table);
    assert.equal(result.status, 200, `${table} should grant anonymous SELECT`);
    assert.ok(Array.isArray(result.rows), `${table} should return a row list`);
  }
});

test("anonymous users cannot read private customer and order rows", async () => {
  for (const table of ["profiles", "carts", "addresses", "orders", "order_items", "payments"]) {
    const result = await anonymousSelect(table);
    assert.ok(
      result.status === 401 || result.status === 403 || (result.status === 200 && result.rows?.length === 0),
      `${table} should reject anonymous SELECT or return no rows; received HTTP ${result.status}`,
    );
  }
});

test("private-table probe returned no customer rows to the anonymous role", async (t) => {
  const results = await Promise.all(["profiles", "carts", "addresses", "orders"].map(anonymousSelect));
  const returnedRows = results.reduce((count, result) => count + (result.rows?.length ?? 0), 0);
  assert.equal(returnedRows, 0, "anonymous requests must not expose private rows");
  if (results.every((result) => result.status === 200 && result.rows?.length === 0)) {
    t.diagnostic("All probed private tables were empty, so this confirms the current response but not row-level isolation with fixtures.");
  }
});
