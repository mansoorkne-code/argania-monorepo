# Domain layer

`@webstore/api` contains deterministic, server-only domain rules. It does not
perform raw Supabase mutations and must not accept client-supplied prices,
discounts, stock values, or order totals.

## Current scope

- integer-minor-unit order calculations
- order lifecycle transition validation
- typed domain errors

Database-backed operations such as `createOrder()` and `updateOrderStatus()`
must be introduced only after Phase 3 provides authenticated session handling
and RLS policies. Those operations must read catalog prices and inventory on
the server, calculate totals here, then persist atomically.
