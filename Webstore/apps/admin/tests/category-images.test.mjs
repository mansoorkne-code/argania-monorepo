import assert from "node:assert/strict";
import { test } from "node:test";
import { registerHooks } from "node:module";
import {
  categoryImageFileError,
  isManagedCategoryImage,
  categoryImageUrl,
  maxCategoryImageSize,
} from "../lib/category-images.ts";
// Production uses bundler module resolution; resolve its one extensionless local
// import when running the same service in Node's built-in TypeScript test runner.
const hook = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      specifier === "./category-images" &&
      context.parentURL?.endsWith("/category-image-service.ts")
    )
      return nextResolve(`${specifier}.ts`, context);
    return nextResolve(specifier, context);
  },
});
const { saveCategoryImageRecord, cleanupCategoryImage } =
  await import("../lib/category-image-service.ts");
hook.deregister();
const id = "00000000-0000-4000-8000-000000000001";
const oldPath = `categories/${id}/00000000-0000-4000-8000-000000000002.jpg`;
const nextPath = `categories/${id}/00000000-0000-4000-8000-000000000003.webp`;
function fakeClient({
  rpcError = null,
  cleanupError = null,
  referenced = false,
  throws = false,
} = {}) {
  const calls = [];
  return {
    calls,
    client: {
      async rpc(name, args) {
        calls.push([name, args]);
        if (name === "admin_category_image_cleanup_allowed")
          return { data: !referenced, error: null };
        if (throws) throw new Error("connection interrupted");
        return { data: null, error: rpcError };
      },
      storage: {
        from(bucket) {
          return {
            async remove(paths) {
              calls.push(["remove", paths, bucket]);
              return { error: cleanupError };
            },
          };
        },
      },
    },
  };
}
test("supported formats and file limits", () => {
  for (const type of ["image/jpeg", "image/png", "image/webp", "image/avif"])
    assert.equal(
      categoryImageFileError({ type, size: maxCategoryImageSize }),
      null,
    );
  for (const file of [
    { type: "image/svg+xml", size: 10 },
    { type: "text/plain", size: 10 },
    { type: "image/png", size: 0 },
    { type: "image/png", size: maxCategoryImageSize + 1 },
  ])
    assert.ok(categoryImageFileError(file));
});
test("managed paths are constrained to the category and cannot escape folders", () => {
  assert.equal(isManagedCategoryImage(id, nextPath), true);
  for (const path of [
    "assets/aloe.webp",
    oldPath.replace(id, "00000000-0000-4000-8000-000000000004"),
    `${oldPath}/../x.jpg`,
    `categories/${id}/x.svg`,
  ])
    assert.equal(isManagedCategoryImage(id, path), false);
  assert.match(
    categoryImageUrl("https://example.test/", "assets/a b.webp"),
    /\/assets\/a%20b.webp$/,
  );
});
test("replacement saves metadata before cleaning up the previous image", async () => {
  const { client, calls } = fakeClient();
  const result = await saveCategoryImageRecord(
    client,
    id,
    nextPath,
    " Haircare ",
    oldPath,
  );
  assert.equal(result.ok, true);
  assert.deepEqual(
    calls.map(([name]) => name),
    [
      "admin_set_category_image",
      "admin_category_image_cleanup_allowed",
      "remove",
    ],
  );
  assert.equal(calls[0][1].p_expected_path, oldPath);
  assert.equal(calls[0][1].p_alt_text, "Haircare");
  assert.deepEqual(calls[2][1], [oldPath]);
});
test("known stale writes clean up only the new unattached file", async () => {
  const { client, calls } = fakeClient({
    rpcError: { code: "23514", message: "category_image_conflict" },
  });
  const result = await saveCategoryImageRecord(
    client,
    id,
    nextPath,
    "Haircare",
    oldPath,
  );
  assert.equal(result.ok, false);
  assert.match(result.message, /another session/);
  assert.deepEqual(calls.find(([name]) => name === "remove")[1], [nextPath]);
});
test("ambiguous database failures never delete a potentially committed upload", async () => {
  for (const options of [
    { throws: true },
    { rpcError: { code: "", message: "network failure" } },
  ]) {
    const { client, calls } = fakeClient(options);
    const result = await saveCategoryImageRecord(
      client,
      id,
      nextPath,
      "Haircare",
      oldPath,
    );
    assert.equal(result.ok, false);
    assert.equal(
      calls.some(([name]) => name === "remove"),
      false,
    );
  }
});
test("removal clears the association even if storage cleanup must be retried", async () => {
  const { client, calls } = fakeClient({
    cleanupError: { message: "offline" },
  });
  const result = await saveCategoryImageRecord(client, id, null, "", oldPath);
  assert.equal(result.ok, true);
  assert.equal(result.cleanupPath, oldPath);
  assert.equal(calls[0][1].p_path, null);
  assert.equal(calls[0][1].p_alt_text, null);
});
test("shared assets and referenced files are never removed", async () => {
  const { client, calls } = fakeClient({ referenced: true });
  assert.equal(
    (await saveCategoryImageRecord(client, id, null, "", "assets/aloe.webp"))
      .ok,
    true,
  );
  assert.equal(calls.length, 1);
  assert.equal((await cleanupCategoryImage(client, id, oldPath)).ok, false);
  assert.equal(
    calls.some(([name]) => name === "remove"),
    false,
  );
});
test("alt-only updates preserve the file and invalid input never reaches the database", async () => {
  const { client, calls } = fakeClient();
  assert.equal(
    (await saveCategoryImageRecord(client, id, oldPath, "Alt", oldPath)).ok,
    true,
  );
  assert.equal(calls.length, 1);
  for (const args of [
    ["bad", nextPath, "Alt", null],
    [id, nextPath, "x".repeat(251), null],
    [id, "other.jpg", "Alt", null],
  ])
    assert.equal((await saveCategoryImageRecord(client, ...args)).ok, false);
  assert.equal(calls.length, 1);
});
