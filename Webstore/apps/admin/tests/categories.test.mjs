import assert from "node:assert/strict";
import { test } from "node:test";
import {
  flattenCategories,
  parentCategoryOptions,
} from "../lib/category-tree.ts";
import { adminCategoryInputSchema } from "../../../packages/validations/src/category.ts";

const root = { id: "root", name: "Hair", parent_id: null, status: "active" };
const child = {
  id: "child",
  name: "Shampoo",
  parent_id: "root",
  status: "active",
};
const grandchild = {
  id: "grandchild",
  name: "Dry hair",
  parent_id: "child",
  status: "active",
};
const other = { id: "other", name: "Skin", parent_id: null, status: "draft" };

test("nested rows are ordered under their parents and include full paths", () => {
  const rows = flattenCategories([grandchild, other, child, root]);
  assert.deepEqual(
    rows.map(({ category, depth }) => [category.id, depth]),
    [
      ["root", 0],
      ["child", 1],
      ["grandchild", 2],
      ["other", 0],
    ],
  );
  assert.equal(rows[2]?.path, "Hair / Shampoo / Dry hair");
});
test("parent selector excludes self, all descendants and archived parents", () => {
  assert.deepEqual(
    parentCategoryOptions(
      [
        root,
        child,
        grandchild,
        other,
        { id: "old", name: "Old", parent_id: null, status: "archived" },
      ],
      "root",
    ).map(({ category }) => category.id),
    ["other"],
  );
});
test("legacy cycles and orphans do not lose rows or hang the list", () => {
  const rows = flattenCategories([
    { ...root, parent_id: "child" },
    child,
    { ...other, parent_id: "missing" },
  ]);
  assert.equal(rows.length, 3);
  assert.equal(new Set(rows.map(({ category }) => category.id)).size, 3);
});
const validInput = {
  name: " Hair ",
  slug: "hair-care",
  description: "  ",
  parentId: "",
  status: "active",
};
test("category validation trims names and accepts empty optional fields", () => {
  assert.deepEqual(adminCategoryInputSchema.parse(validInput), {
    name: "Hair",
    slug: "hair-care",
    description: null,
    parentId: null,
    status: "active",
  });
});
test("rejects invalid slugs, parent ids, statuses, oversized fields and file inputs", () => {
  for (const slug of [
    "",
    "Hair",
    "hair--care",
    "-hair",
    "hair-",
    "hair/care",
    "hair care",
    "a".repeat(181),
  ]) {
    assert.equal(
      adminCategoryInputSchema.safeParse({ ...validInput, slug }).success,
      false,
      slug,
    );
  }
  for (const patch of [
    { parentId: "bad" },
    { status: "deleted" },
    { name: " " },
    { name: "a".repeat(181) },
    { description: "x".repeat(5001) },
    { name: new Blob(["name"]) },
  ]) {
    assert.equal(
      adminCategoryInputSchema.safeParse({ ...validInput, ...patch }).success,
      false,
    );
  }
});
