import type { Metadata } from "next";
import Link from "next/link";
import { ErrorState } from "@repo/ui/error-state";
import {
  adminOrderFiltersSchema,
  orderStatuses,
  paymentStatuses,
  type AdminOrderFilters,
} from "@webstore/validations/orders";
import { createClient } from "../../../lib/supabase/server";
import {
  authorizeOrderRead,
  getAdminOrders,
  orderPageSize,
  orderPageHref,
  formatOrderMoney,
  formatOrderDate,
  orderLabel,
} from "../../../lib/order-data";
import { handleOrderAccessError } from "../../../lib/order-access";
import { OrderStatus } from "./order-ui";
import styles from "./orders.module.css";

export const metadata: Metadata = { title: "Orders" };
type Params = Record<string, string | string[] | undefined>;
export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const raw = Object.fromEntries(
    [
      "q",
      "status",
      "payment",
      "from",
      "to",
      "customer",
      "number",
      "sort",
      "p",
    ].map((key) => [
      key,
      Array.isArray(params[key]) ? params[key][0] : params[key],
    ]),
  );
  const parsed = adminOrderFiltersSchema.safeParse(raw);
  const filters = parsed.success
    ? parsed.data
    : adminOrderFiltersSchema.parse({});
  const client = await createClient();
  let result: Awaited<ReturnType<typeof getAdminOrders>> | null = null;
  try {
    if (parsed.success) result = await getAdminOrders(client, filters);
    else await authorizeOrderRead(client);
  } catch (error) {
    handleOrderAccessError(error);
    return (
      <div className={styles.page}>
        <ErrorState
          title="Unable to load orders"
          description="Please try again. Confirm the admin order-management migration has been applied if this continues."
          action={<Link href="/admin/orders">Try again</Link>}
        />
      </div>
    );
  }
  const totalPages = Math.max(
    1,
    Math.ceil((result?.total_count ?? 0) / orderPageSize),
  );
  function sortHref(sort: AdminOrderFilters["sort"]) {
    return orderPageHref({ ...filters, sort }, 1);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Sales & fulfilment</p>
          <h2>Orders</h2>
          <p>
            Find orders and review their customer, shipping and payment records.
          </p>
        </div>
        <span className={styles.resultCount}>
          {result?.total_count ?? 0}{" "}
          {result?.total_count === 1 ? "order" : "orders"}
        </span>
      </header>
      <form action="/admin/orders" method="get" className={styles.filters}>
        <label className={styles.search}>
          <span>Search orders</span>
          <input
            type="search"
            name="q"
            defaultValue={String(raw.q ?? "")}
            maxLength={100}
            placeholder="Order number, customer name, phone or ID"
          />
        </label>
        <label>
          <span>Order status</span>
          <select name="status" defaultValue={filters.status}>
            <option value="">All order statuses</option>
            {orderStatuses.map((status) => (
              <option value={status} key={status}>
                {orderLabel(status)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Payment status</span>
          <select name="payment" defaultValue={filters.payment}>
            <option value="">All payment statuses</option>
            {paymentStatuses.map((status) => (
              <option value={status} key={status}>
                {orderLabel(status)}
              </option>
            ))}
            <option value="none">Not recorded</option>
          </select>
        </label>
        <label>
          <span>From date (IST)</span>
          <input
            type="date"
            name="from"
            defaultValue={String(raw.from ?? "")}
          />
        </label>
        <label>
          <span>To date (IST)</span>
          <input type="date" name="to" defaultValue={String(raw.to ?? "")} />
        </label>
        <label>
          <span>Customer</span>
          <input
            name="customer"
            defaultValue={String(raw.customer ?? "")}
            maxLength={100}
            placeholder="Name, phone or customer ID"
          />
        </label>
        <label>
          <span>Order number</span>
          <input
            name="number"
            defaultValue={String(raw.number ?? "")}
            maxLength={19}
            inputMode="numeric"
            placeholder="Exact order number"
          />
        </label>
        <label>
          <span>Sort orders</span>
          <select name="sort" defaultValue={filters.sort}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="total_desc">Highest total</option>
            <option value="total_asc">Lowest total</option>
            <option value="number_desc">Order number: descending</option>
            <option value="number_asc">Order number: ascending</option>
          </select>
        </label>
        <div className={styles.filterActions}>
          <button
            className="ui-button ui-button--primary ui-button--md"
            type="submit"
          >
            Apply filters
          </button>
          <Link href="/admin/orders">Reset</Link>
        </div>
      </form>
      {!parsed.success ? (
        <div className={styles.validation} role="alert">
          <strong>Check your filters</strong>
          <ul>
            {parsed.error.issues.map((issue, index) => (
              <li key={index}>
                {issue.path.join(" ")}: {issue.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {result?.orders.length ? (
        <div className={styles.tableFrame}>
          <table className={styles.table}>
            <caption className={styles.srOnly}>
              Orders matching the selected filters. Dates use India Standard
              Time.
            </caption>
            <thead>
              <tr>
                <th
                  scope="col"
                  aria-sort={
                    filters.sort === "number_asc"
                      ? "ascending"
                      : filters.sort === "number_desc"
                        ? "descending"
                        : "none"
                  }
                >
                  <Link
                    href={sortHref(
                      filters.sort === "number_desc"
                        ? "number_asc"
                        : "number_desc",
                    )}
                  >
                    Order ↕
                  </Link>
                </th>
                <th
                  scope="col"
                  aria-sort={
                    filters.sort === "newest"
                      ? "descending"
                      : filters.sort === "oldest"
                        ? "ascending"
                        : "none"
                  }
                >
                  <Link
                    href={sortHref(
                      filters.sort === "newest" ? "oldest" : "newest",
                    )}
                  >
                    Created (IST) ↕
                  </Link>
                </th>
                <th scope="col">Customer</th>
                <th scope="col">Order status</th>
                <th scope="col">Payments</th>
                <th
                  scope="col"
                  aria-sort={
                    filters.sort === "total_asc"
                      ? "ascending"
                      : filters.sort === "total_desc"
                        ? "descending"
                        : "none"
                  }
                >
                  <Link
                    href={sortHref(
                      filters.sort === "total_desc"
                        ? "total_asc"
                        : "total_desc",
                    )}
                  >
                    Total ↕
                  </Link>
                </th>
                <th scope="col">
                  <span className={styles.srOnly}>Details</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {result.orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link
                      className={styles.orderLink}
                      href={`/admin/orders/${order.id}`}
                    >
                      #{order.order_number}
                    </Link>
                  </td>
                  <td>{formatOrderDate(order.created_at)}</td>
                  <td>
                    <strong>
                      {order.customer_name || "Customer unavailable"}
                    </strong>
                    <small>
                      {order.customer_phone ||
                        (order.user_id
                          ? "No phone recorded"
                          : "Account deleted")}
                    </small>
                  </td>
                  <td>
                    <OrderStatus value={order.status} />
                  </td>
                  <td>
                    <div className={styles.badges}>
                      {order.payment_statuses.length ? (
                        order.payment_statuses.map((status) => (
                          <OrderStatus key={status} value={status} />
                        ))
                      ) : (
                        <span className={styles.muted}>Not recorded</span>
                      )}
                    </div>
                  </td>
                  <td className={styles.money}>
                    {formatOrderMoney(order.total, order.currency)}
                  </td>
                  <td>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      aria-label={`View order ${order.order_number}`}
                    >
                      View order →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : parsed.success ? (
        <section className={styles.empty}>
          <h3>
            {filters.p > totalPages
              ? "No orders on this page"
              : "No matching orders"}
          </h3>
          <p>Try another order number, customer or date range.</p>
          <Link href={orderPageHref(filters, 1)}>Go to the first page</Link>
        </section>
      ) : null}
      {result ? (
        <nav className={styles.pagination} aria-label="Order pages">
          <span>
            {filters.p > 1 ? (
              <Link href={orderPageHref(filters, filters.p - 1)}>
                ← Previous
              </Link>
            ) : (
              ""
            )}
          </span>
          <span>
            Page {filters.p} of {totalPages} · {result.total_count}{" "}
            {result.total_count === 1 ? "order" : "orders"}
          </span>
          <span>
            {filters.p < totalPages ? (
              <Link href={orderPageHref(filters, filters.p + 1)}>Next →</Link>
            ) : (
              ""
            )}
          </span>
        </nav>
      ) : null}
      <p className={styles.hint}>
        Date filters include the whole selected day in IST. Payment filters
        match any recorded payment attempt; an order appears once.
      </p>
    </div>
  );
}
