import assert from "node:assert/strict";
import { test } from "node:test";
import { adminOrderFiltersSchema } from "../../../packages/validations/src/orders.ts";
import {
  getAdminOrders,
  getAdminOrder,
  OrderAccessError,
  orderPageHref,
  snapshotText,
} from "../lib/order-data.ts";
const id = "22222222-2222-4222-8222-222222222222";
function client(role = "admin", options = {}) {
  const calls = [];
  const result = { orders: [], total_count: 0 };
  return {
    calls,
    auth: {
      async getUser() {
        return {
          data: { user: options.signedOut ? null : { id } },
          error: options.authError ?? null,
        };
      },
    },
    from(table) {
      calls.push(table);
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        async maybeSingle() {
          return {
            data: role ? { role } : null,
            error: options.profileError ?? null,
          };
        },
      };
    },
    async rpc(name, args) {
      calls.push({ name, args });
      return { data: options.data ?? result, error: options.rpcError ?? null };
    },
  };
}
test("customers and managers cannot access list or detail RPCs, even with another customer order ID", async () => {
  for (const role of ["customer", "manager", null])
    for (const operation of [
      (c) => getAdminOrders(c, adminOrderFiltersSchema.parse({})),
      (c) => getAdminOrder(c, id),
    ]) {
      const c = client(role);
      await assert.rejects(
        operation(c),
        (e) => e instanceof OrderAccessError && e.status === 403,
      );
      assert.deepEqual(c.calls, ["profiles"]);
    }
});
test("unauthenticated, failed profile lookup, and failed identity verification deny access", async () => {
  for (const [options, status] of [
    [{ signedOut: true }, 401],
    [{ authError: new Error("auth") }, 401],
    [{ profileError: new Error("profile") }, 403],
  ]) {
    const c = client("admin", options);
    await assert.rejects(getAdminOrder(c, id), (e) => e.status === status);
    assert.equal(
      c.calls.some((v) => typeof v === "object"),
      false,
    );
  }
});
test("filter parsing rejects invalid dates, ranges, pagination, unknown enum and sorting values", () => {
  for (const patch of [
    { from: "2026-02-30" },
    { from: "2026-10-21", to: "2026-10-20" },
    { p: "1.5" },
    { p: "-1" },
    { p: "1000001" },
    { status: "deleted" },
    { payment: "settled" },
    { sort: "total;delete" },
    { number: "1e3" },
    { number: "9223372036854775808" },
    { q: "a".repeat(101) },
  ])
    assert.equal(
      adminOrderFiltersSchema.safeParse(patch).success,
      false,
      JSON.stringify(patch),
    );
});
test("exact bigint order numbers remain strings; search is passed as data, not PostgREST syntax", async () => {
  const c = client();
  const filters = adminOrderFiltersSchema.parse({
    number: "9007199254740993",
    q: "name,or(status.eq.paid)",
    payment: "paid",
    from: "2026-10-01",
    to: "2026-10-20",
    customer: "A customer",
    sort: "total_asc",
    p: "2",
  });
  await getAdminOrders(c, filters);
  const call = c.calls.at(-1);
  assert.equal(call.args.p_number, "9007199254740993");
  assert.equal(call.args.p_search, filters.q);
  assert.equal(call.args.p_page, 2);
  assert.equal(call.args.p_payment, "paid");
  assert.equal(call.args.p_from, "2026-10-01");
});
test("invalid IDs never reach a detail RPC; valid missing orders return null", async () => {
  const c = client();
  assert.equal(await getAdminOrder(c, "not-an-id"), null);
  assert.deepEqual(c.calls, ["profiles"]);
  const missing = client("admin", { data: null });
  missing.rpc = async () => ({ data: null, error: null });
  assert.equal(await getAdminOrder(missing, id), null);
});
test("pagination preserves all filters, resets correctly, and escapes customer input", () => {
  const filters = adminOrderFiltersSchema.parse({
    q: "A & B",
    status: "shipped",
    payment: "paid",
    customer: "customer/id",
    number: "42",
    from: "2026-10-01",
    to: "2026-10-20",
    sort: "oldest",
  });
  const url = new URL(orderPageHref(filters, 3), "https://example.com");
  assert.equal(url.searchParams.get("q"), "A & B");
  assert.equal(url.searchParams.get("customer"), "customer/id");
  assert.equal(url.searchParams.get("p"), "3");
  assert.equal(url.searchParams.get("payment"), "paid");
  assert.equal(url.searchParams.get("sort"), "oldest");
  assert.equal(
    new URL(orderPageHref(filters, 1), "https://example.com").searchParams.has(
      "p",
    ),
    false,
  );
});
test("snapshot display ignores non-string values and preserves historical data", () => {
  assert.equal(
    snapshotText({ line1: "  Old address " }, "line1"),
    "Old address",
  );
  assert.equal(
    snapshotText({ line1: { current: "New address" } }, "line1"),
    "",
  );
  assert.equal(snapshotText({}, "phone"), "");
});
test("database failures are surfaced instead of silently showing an empty order list", async () => {
  await assert.rejects(
    getAdminOrders(
      client("admin", { rpcError: new Error("db") }),
      adminOrderFiltersSchema.parse({}),
    ),
    /Unable to load orders/,
  );
});
