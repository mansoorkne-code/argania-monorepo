export type CategoryNode = {
  id: string;
  name: string;
  parent_id: string | null;
  status: "draft" | "active" | "archived";
};

/** Flatten a hierarchy without losing orphaned rows or looping over legacy cycles. */
export function flattenCategories<T extends CategoryNode>(categories: T[]) {
  const children = new Map<string | null, T[]>();
  const ids = new Set(categories.map((category) => category.id));
  for (const category of categories) {
    const parent =
      category.parent_id && ids.has(category.parent_id)
        ? category.parent_id
        : null;
    const siblings = children.get(parent) ?? [];
    siblings.push(category);
    children.set(parent, siblings);
  }
  for (const siblings of children.values())
    siblings.sort((a, b) => a.name.localeCompare(b.name));
  const rows: { category: T; depth: number; path: string }[] = [];
  const visited = new Set<string>();
  function visit(category: T, depth: number, path: string) {
    if (visited.has(category.id)) return;
    visited.add(category.id);
    const nextPath = path ? `${path} / ${category.name}` : category.name;
    rows.push({ category, depth, path: nextPath });
    for (const child of children.get(category.id) ?? [])
      visit(child, depth + 1, nextPath);
  }
  for (const root of children.get(null) ?? []) visit(root, 0, "");
  for (const category of categories)
    if (!visited.has(category.id)) visit(category, 0, "");
  return rows;
}

export function parentCategoryOptions<T extends CategoryNode>(
  categories: T[],
  editingId?: string,
) {
  const excluded = new Set<string>(editingId ? [editingId] : []);
  let changed = true;
  while (changed) {
    changed = false;
    for (const category of categories) {
      if (
        category.parent_id &&
        excluded.has(category.parent_id) &&
        !excluded.has(category.id)
      ) {
        excluded.add(category.id);
        changed = true;
      }
    }
  }
  return flattenCategories(categories).filter(
    ({ category }) =>
      !excluded.has(category.id) && category.status !== "archived",
  );
}
