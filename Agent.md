# AGENTS.md

## Project Overview

This repository contains a production-grade ecommerce platform built as a Turborepo monorepo.

The platform consists of:

1. A customer-facing ecommerce storefront.
2. An authenticated admin dashboard.
3. A shared Supabase backend.
4. Product and inventory management.
5. Order management.
6. Analytics.
7. Authentication and authorization.
8. Shared UI, types, validation, and business logic packages.

The primary goal is to build a maintainable, secure, strongly typed ecommerce system without unnecessary architectural complexity.

---

# 1. Technology Stack

## Monorepo

- pnpm
- Turborepo
- TypeScript

## Applications

### `apps/storefront`

Customer-facing ecommerce application.

### `apps/admin`

Administrative dashboard for managing the ecommerce operation.

## Shared Packages

### `packages/ui`

Shared UI components and design primitives.

### `packages/db`

Supabase client, generated database types, database helpers, and database-related utilities.

### `packages/auth`

Authentication, sessions, authorization, role handling, and permission utilities.

### `packages/api`

Server-side business/domain operations shared between applications where appropriate.

### `packages/validations`

Zod schemas and input validation.

### `packages/types`

Shared domain types.

### `packages/config`

Shared configuration and constants.

## Backend

Supabase:

- PostgreSQL
- Supabase Auth
- Supabase Storage
- Row Level Security
- Database functions/views where appropriate
- Edge Functions only when genuinely necessary

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui principles
- React Hook Form
- Zod

## Testing

- Vitest
- Playwright

---

# 2. Repository Structure

The expected structure is:

```text
webstore/
├── apps/
│   ├── storefront/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── ...
│   │
│   └── admin/
│       ├── app/
│       ├── components/
│       ├── lib/
│       └── ...
│
├── packages/
│   ├── ui/
│   ├── db/
│   ├── auth/
│   ├── api/
│   ├── validations/
│   ├── types/
│   └── config/
│
├── supabase/
│   ├── migrations/
│   ├── functions/
│   ├── seed.sql
│   └── config.toml
│
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.json
└── AGENTS.md
```

Do not introduce additional top-level applications or packages without a clear architectural reason.

---

# 3. Core Architectural Principles

## 3.1 Keep the architecture simple

This is a monolith-oriented application using a modular monorepo.

Do NOT introduce:

- Microservices
- Message brokers
- Kubernetes
- Separate backend infrastructure
- GraphQL
- Event sourcing

unless a concrete requirement appears that justifies them.

Supabase + Next.js + Turborepo should handle the initial architecture.

---

## 3.2 Single source of truth

Supabase PostgreSQL is the source of truth for:

- Products
- Inventory
- Orders
- Customers
- Payments
- Coupons
- Categories
- Order status
- Analytics source data

Do not create competing sources of truth.

---

## 3.3 Business logic belongs on the server

Never trust the browser for business-critical values.

The browser may provide:

```text
product_id
variant_id
quantity
coupon_code
address_id
```

But the server must determine:

```text
product price
variant price
inventory
discount
shipping
subtotal
tax
total
permissions
order validity
```

---

## 3.4 Database security is mandatory

Frontend authorization is not security.

This is insufficient:

```ts
if (user.role === "admin") {
  // allow operation
}
```

Authorization must also be enforced through:

- Server-side authorization
- Supabase RLS
- Appropriate database constraints
- Secure server-side operations

---

# 4. Database Architecture

The primary entities are:

```text
profiles
categories
products
product_variants
product_images

carts
cart_items

addresses

orders
order_items
order_status_history

payments

coupons
coupon_usages
```

Additional tables require architectural justification.

---

# 5. Orders

Orders are one of the most important domain concepts.

## Order items are historical snapshots

When an order is created, `order_items` must preserve:

```text
product name
SKU
variant information
unit price
quantity
line total
```

Do not rely on the current `products` table to reconstruct historical orders.

For example:

```text
Today:
Product = "Premium Shirt"
Price = ₹1,999

Customer purchases product.

Tomorrow:
Product renamed to "Premium Shirt Pro"
Price = ₹2,499
```

Yesterday's order must still display:

```text
Premium Shirt
₹1,999
```

---

# 6. Order Lifecycle

The default lifecycle is:

```text
PENDING
   ↓
CONFIRMED
   ↓
PROCESSING
   ↓
SHIPPED
   ↓
DELIVERED
```

Possible alternate paths:

```text
PENDING → CANCELLED

CONFIRMED → CANCELLED

PROCESSING → CANCELLED

DELIVERED → REFUND_REQUESTED → REFUNDED
```

Do not allow arbitrary status changes.

Every status transition must:

1. Be validated.
2. Be authorized.
3. Be persisted.
4. Be recorded in `order_status_history`.

---

# 7. Inventory

Inventory must be treated as a server-side concern.

Never trust:

```ts
clientStock
```

or any inventory value supplied by the browser.

Before creating an order:

1. Fetch current inventory.
2. Validate requested quantity.
3. Calculate the order.
4. Safely update inventory.
5. Create the order atomically where appropriate.

Prevent:

- Negative inventory
- Overselling
- Duplicate inventory decrements
- Inventory changes from unauthorized clients

---

# 8. Pricing

Never trust client-provided:

```text
price
subtotal
discount
shipping
tax
total
```

The client should send product/variant identifiers and quantities.

The server recalculates:

```text
subtotal
- discount
+ shipping
+ tax
= total
```

Any displayed client-side total is informational only.

---

# 9. Authentication

Supabase Auth is responsible for identity.

Application profiles contain application-specific information.

Roles:

```text
customer
admin
manager
```

Do not store authentication passwords manually.

Do not build a custom authentication system.

---

# 10. Authorization

Customers:

```text
Can:
- Read public catalog
- Manage their profile
- Manage their addresses
- Manage their cart
- Create orders
- Read their own orders

Cannot:
- Read other customers
- Modify products
- Modify inventory
- Modify order totals
- Access admin analytics
- Access administrative operations
```

Admins:

```text
Can:
- Manage products
- Manage categories
- Manage inventory
- Manage orders
- View customers
- View analytics
```

Managers may have a restricted subset of administrative capabilities.

Never assume that an authenticated user is an administrator.

---

# 11. Supabase RLS

Every private table must have appropriate RLS policies.

Before adding a table, answer:

```text
Who can SELECT?
Who can INSERT?
Who can UPDATE?
Who can DELETE?
```

Do not leave private tables without explicit policies.

RLS should be treated as a mandatory security boundary.

---

# 12. Supabase Service Role

The Supabase service-role key is server-only.

NEVER:

- Put it in client-side code.
- Prefix it as a public environment variable.
- Return it through an API.
- Store it in source control.
- Expose it in logs.

Use the normal authenticated Supabase client wherever possible.

Use service-role access only for explicitly justified trusted server-side operations.

---

# 13. Supabase Storage

Product images should be stored in Supabase Storage.

Recommended structure:

```text
product-images/
  <product-id>/
    image-1.webp
    image-2.webp
```

PostgreSQL should store:

```text
storage path
```

rather than image binary data.

Storage policies must prevent unauthorized uploads/deletions.

---

# 14. Shared Packages

Business logic should not be duplicated between:

```text
apps/storefront
apps/admin
```

If functionality is genuinely shared, place it in the appropriate package.

Examples:

```text
Zod schemas
→ packages/validations

Database types
→ packages/db

Domain types
→ packages/types

Authentication
→ packages/auth

Reusable UI
→ packages/ui
```

Do not create a package simply to move a few lines of code.

---

# 15. UI Architecture

Use shared components from:

```text
packages/ui
```

Examples:

```text
Button
Input
Dialog
Card
Badge
Table
DataTable
Tabs
Toast
Skeleton
Pagination
EmptyState
ErrorState
ConfirmDialog
```

Components should:

- Be accessible.
- Be reusable.
- Avoid application-specific business logic.
- Avoid direct database access.
- Support loading/error/disabled states where appropriate.

---

# 16. Storefront

Primary routes:

```text
/
 /products
 /products/[slug]
 /categories/[slug]
 /cart
 /checkout
 /login
 /register
 /account
 /account/orders
 /account/orders/[id]
```

Core storefront capabilities:

```text
Product discovery
Search
Filtering
Sorting
Product details
Variants
Cart
Checkout
Authentication
Orders
Account management
```

Do not put admin functionality inside the storefront.

---

# 17. Admin Dashboard

Primary routes:

```text
/admin
/admin/orders
/admin/orders/[id]
/admin/products
/admin/products/new
/admin/products/[id]
/admin/categories
/admin/customers
/admin/analytics
/admin/settings
```

The admin dashboard should focus on operational workflows.

Primary areas:

```text
Dashboard
Orders
Products
Inventory
Categories
Customers
Analytics
Settings
```

---

# 18. Analytics

Analytics should be calculated efficiently.

Do not fetch every order into React and perform large aggregations in the browser.

Prefer:

```text
PostgreSQL
↓
views/functions/aggregate queries
↓
server
↓
dashboard
```

Metrics include:

```text
Revenue
Orders
Average order value
Customers
New customers
Top products
Top categories
Cancellation rate
Refund rate
```

Every metric must have a documented definition.

For example:

```text
Revenue:
Sum of eligible completed/paid order totals
```

Do not silently change metric definitions.

---

# 19. Input Validation

All external input must be validated.

Use Zod.

Validate:

```text
Forms
Server actions
API requests
Query parameters
Route parameters where appropriate
Admin mutations
Checkout requests
Coupon requests
```

Never assume TypeScript types alone validate runtime input.

TypeScript:

```ts
type ProductInput = ...
```

does not protect against malicious runtime input.

Zod does.

---

# 20. API / Server Operations

Server operations should expose domain-level actions rather than raw database operations where business logic exists.

Prefer:

```text
createOrder()
updateOrderStatus()
createProduct()
updateProduct()
applyCoupon()
```

over exposing arbitrary:

```text
insert()
update()
delete()
```

operations throughout the application.

---

# 21. Error Handling

Errors should be:

- Explicit
- Typed where practical
- Safe for users
- Useful for developers

Never expose:

```text
database credentials
SQL internals
stack traces
service-role credentials
sensitive user information
```

to users.

User-facing errors should be understandable.

Developer logs should contain enough context to debug the issue without exposing secrets.

---

# 22. Loading and Empty States

Every major data-driven screen should account for:

```text
Loading
Success
Empty
Error
```

Examples:

```text
No products found.
No orders yet.
No analytics data for this period.
Unable to load order.
```

Do not leave users staring at blank screens.

---

# 23. Testing

Use Vitest for:

```text
Business logic
Validation
Calculations
Domain functions
```

Use Playwright for:

```text
Customer flows
Admin flows
Critical end-to-end workflows
```

Critical workflows include:

```text
Registration
Login
Browse product
Add to cart
Checkout
Create order
View order
Admin login
View orders
Update order
Create product
Edit product
```

Business-critical functionality should have tests.

---

# 24. Testing Business Rules

At minimum, test:

```text
Cart totals
Quantity validation
Inventory validation
Coupon calculations
Order totals
Order creation
Duplicate checkout
Order status transitions
Authorization
RLS
Admin permissions
```

Do not only test happy paths.

Test failure scenarios.

---

# 25. Database Migrations

Never modify an already-applied migration.

Create a new migration for schema changes.

Correct:

```text
001_initial_schema.sql
002_add_coupon_usage.sql
003_add_order_tracking.sql
```

Incorrect:

```text
Editing 001_initial_schema.sql
after it has already been applied
```

Database changes must be reproducible from migrations.

---

# 26. Dependencies

Before adding a dependency, ask:

1. Is it actually necessary?
2. Can existing dependencies solve the problem?
3. Is it maintained?
4. Does it introduce unnecessary complexity?
5. Does it work correctly in a Turborepo/Next.js environment?

Do not install libraries simply because they are popular.

---

# 27. Environment Variables

Never commit secrets.

Expected categories include:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Only variables explicitly intended for browser usage should use the public prefix.

Keep environment variable documentation updated.

---

# 28. Git and Change Discipline

Keep changes focused.

Prefer:

```text
feat: add product catalog
feat: implement cart
feat: add admin order management
fix: prevent duplicate order creation
test: add checkout integration tests
```

Avoid giant unrelated commits.

Do not modify unrelated files simply because they are nearby.

---

# 29. Phase Discipline

The project is developed incrementally.

Recommended order:

```text
Phase 0  Architecture
Phase 1  Turborepo
Phase 2  Database
Phase 3  Auth + RLS
Phase 4  Domain layer
Phase 5  Shared UI
Phase 6  Storefront shell
Phase 7  Product catalog
Phase 8  Cart
Phase 9  Checkout + orders
Phase 10 Admin shell
Phase 11 Order management
Phase 12 Product/inventory management
Phase 13 Analytics
Phase 14 Testing
Phase 15 Security audit
Phase 16 Performance
Phase 17 Deployment
```

## Important

Do NOT implement future phases prematurely.

If asked to implement Phase 7, do not independently build:

```text
checkout
payments
analytics
admin dashboard
```

unless explicitly requested.

This keeps the project reviewable and prevents architectural drift.

---

# 30. Handling Ambiguous Requirements

If a requirement is ambiguous:

Do not silently invent a business rule.

Instead:

1. Identify the ambiguity.
2. Explain the relevant architectural options.
3. Choose the simplest reasonable default if implementation must continue.
4. Document the assumption.
5. Make the implementation easy to change later.

Example:

```text
Shipping calculation is unspecified.

Assumption:
Shipping is currently represented as a configurable fixed value.

Reason:
The checkout architecture can support dynamic shipping later without coupling the order model to a specific provider.
```

---

# 31. Before Modifying Existing Code

Before making a substantial change:

1. Inspect the relevant files.
2. Understand existing patterns.
3. Reuse existing abstractions.
4. Check whether the functionality already exists.
5. Check existing tests.
6. Check package boundaries.
7. Check database dependencies.

Do not rewrite working systems unnecessarily.

---

# 32. Before Database Changes

Before modifying the schema:

1. Inspect current schema.
2. Check foreign keys.
3. Check RLS policies.
4. Check indexes.
5. Check existing queries.
6. Create a migration.
7. Update generated types.
8. Update affected validation/domain types.
9. Update tests.

---

# 33. Definition of Done

A feature is not complete simply because the UI works.

A feature is considered complete when applicable:

```text
✓ Implementation complete
✓ TypeScript passes
✓ Lint passes
✓ Validation exists
✓ Authorization exists
✓ RLS is correct
✓ Loading state exists
✓ Empty state exists
✓ Error handling exists
✓ Tests exist
✓ Database migration exists if required
✓ Documentation is updated
```

---

# 34. Required Verification

After significant implementation changes, run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

For relevant E2E changes:

```bash
pnpm test:e2e
```

Do not claim a feature is working without verifying it.

If a command cannot be run, explicitly state that it could not be verified.

---

# 35. Code Quality Rules

Prefer:

```text
Readable code
Small functions
Explicit data flow
Strong typing
Simple abstractions
Reusable domain logic
Predictable naming
```

Avoid:

```text
Huge components
Deeply nested conditionals
Duplicated business logic
Magic numbers
Unnecessary abstractions
Global mutable state
Uncontrolled database access
Client-side security checks as the only protection
```

---

# 36. Performance Principles

Do not prematurely optimize.

However, avoid obvious performance problems:

Do not:

```text
Fetch thousands of rows to the browser
Run large analytics aggregations in React
Load full-resolution images unnecessarily
Create unnecessary client components
Make sequential database calls when safe parallelization is possible
```

Use:

```text
Pagination
Indexes
Server rendering
Database aggregation
Image optimization
Caching where appropriate
```

Optimize based on actual bottlenecks.

---

# 37. Accessibility

The storefront and admin dashboard should follow basic accessibility practices.

Ensure:

```text
Keyboard navigation
Semantic HTML
Accessible labels
Visible focus states
Sufficient contrast
ARIA only when necessary
Accessible dialogs
Accessible form errors
```

Do not sacrifice accessibility for visual effects.

---

# 38. SEO

The storefront should support:

```text
Page metadata
Product metadata
Open Graph metadata
Sitemap
robots.txt
Canonical URLs where appropriate
```

Admin pages should not be indexed.

---

# 39. Security Checklist

Before production, verify:

```text
[ ] RLS enabled
[ ] RLS policies tested
[ ] Admin routes protected
[ ] Service role server-only
[ ] Input validation
[ ] Price validation server-side
[ ] Inventory validation server-side
[ ] Coupon validation server-side
[ ] Order authorization
[ ] Storage policies
[ ] No secrets committed
[ ] No sensitive data in logs
[ ] Error messages sanitized
[ ] Rate limiting where required
[ ] File upload validation
[ ] Authentication flows tested
[ ] Privilege escalation tested
```

---

# 40. Agent Operating Rules

When working on this repository:

1. Read this file before making architectural changes.
2. Follow existing patterns before introducing new ones.
3. Do not bypass package boundaries.
4. Do not bypass RLS.
5. Do not expose secrets.
6. Do not trust client-side business values.
7. Do not modify applied migrations.
8. Do not introduce unnecessary dependencies.
9. Do not implement future phases without being asked.
10. Do not remove existing functionality without explicit instruction.
11. Do not silently change business rules.
12. Run relevant tests after changes.
13. Run typecheck after TypeScript changes.
14. Run lint after code changes.
15. Keep changes focused.
16. Prefer maintainability over cleverness.
17. If something is unclear, surface the ambiguity.
18. If you discover an architectural problem, explain it before making a large redesign.
19. Preserve backward compatibility unless the current phase explicitly requires a breaking change.
20. Treat security and data integrity as higher priority than implementation speed.

---

# 41. Final Architecture

The intended architecture is:

```text
                    ┌─────────────────────┐
                    │      Supabase       │
                    │                     │
                    │ PostgreSQL          │
                    │ Auth                │
                    │ Storage             │
                    │ RLS                 │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Shared Packages     │
                    │                     │
                    │ db                  │
                    │ auth                │
                    │ api                 │
                    │ validations         │
                    │ types               │
                    │ ui                  │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
        ┌────────▼────────┐         ┌────────▼────────┐
        │   Storefront    │         │      Admin      │
        │                 │         │                 │
        │ Next.js         │         │ Next.js         │
        │ Customer UX     │         │ Operations      │
        │ Catalog         │         │ Orders          │
        │ Cart            │         │ Products        │
        │ Checkout        │         │ Inventory       │
        │ Account         │         │ Analytics       │
        └─────────────────┘         └─────────────────┘
```

The system should remain modular internally while being operationally simple:

```text
Turborepo
    +
Next.js
    +
Supabase
    +
Shared packages
    +
Strong typing
    +
RLS
    +
Automated tests
```

This is the baseline architecture. Any significant deviation should be justified by a concrete requirement rather than introduced by default.