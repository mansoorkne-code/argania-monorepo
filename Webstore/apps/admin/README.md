# Argania admin

The admin app uses the shared Supabase Auth project and reads its public
configuration from `Webstore/.env.local` in development. Its `/admin` route
checks the signed-in user and their `public.profiles.role` on the server; only
`admin` and `manager` profiles can enter the dashboard.

## Google sign-in setup

1. Configure the same Google provider credentials in Supabase Auth used by the
   storefront.
2. Add the admin app callback URL (`http://localhost:3001/auth/callback` for
   local development and `https://<admin-host>/auth/callback` in production)
   to the Supabase Auth redirect URL allow list.
3. Set the admin user's `public.profiles.role` to `admin` (or `manager`).
4. Set `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the shared environment file or
   admin hosting environment.

The app runs locally on port 3001 with `pnpm --filter @webstore/admin dev`.
