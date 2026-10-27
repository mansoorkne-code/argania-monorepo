# Argania admin

The admin app runs on Vinext and Vite with React Server Components. Existing
App Router pages, server actions, `proxy.ts`, and `next/*` imports stay in place;
Vinext provides their runtime implementation.

Live admin: <https://argania-admin.faraz2711.workers.dev>.

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

## Run and build

Use Node.js 24 or newer and the workspace's pinned pnpm version. From `Webstore/`:

```sh
pnpm install
pnpm --filter @webstore/admin dev
```

Open <http://localhost:3001>. Both development and production scripts load shared
`Webstore/.env` files (including the appropriate mode-specific variants) before
running the toolchain.

```sh
pnpm --filter @webstore/admin check-types
pnpm --filter @webstore/admin lint
pnpm --filter @webstore/admin test
pnpm --filter @webstore/admin build
pnpm --filter @webstore/admin start
pnpm --filter @webstore/admin run deploy
```

`build` produces Cloudflare Build Output in `apps/admin/.cloudflare/output/`.
`start` previews the built Worker locally on port 3001.
`cloudflare.config.ts` defines the separate `argania-admin` Worker and static
assets. Optional cache and image services are disabled.

`run deploy` rebuilds and deploys to Cloudflare. Authenticate first with
`pnpm --filter @webstore/admin exec cf auth login`, or set
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in CI.
The deployment uploads only the public Supabase URL, publishable key, and image
bucket configuration as Worker secrets. The deploy script uses a restricted
temporary file and removes it afterwards. It does not upload service-role keys
or payment/shipping credentials. Pass `--prebuilt` to reuse a validated build.

Allow the deployed `/auth/callback` URL (including its `?next=...` query) in
Supabase Authentication → URL Configuration before completing Google sign-in.
For the Workers URL, add
`https://argania-admin.faraz2711.workers.dev/auth/callback**` under Redirect URLs.
Keep the shared project's Site URL set to the storefront's main domain.

Type checking runs `vinext typegen` before TypeScript. Generated `next-env.d.ts`
and `.next/types/routes.d.ts` remain disposable. The `next` package is retained
for API types, and `@next/env` loads the shared environment; dev, build, start,
and type generation do not invoke the Next.js CLI.

`vite.config.ts` configures stable CSS Module names and deduplicates React for
workspace UI components. The local `turbo.json` caches the build output and tracks the
shared environment files. Authentication and admin permission checks remain
server-side, including the checks in the order-management RPCs.

The migration was verified with a production build, type checking, lint, the
admin unit tests, local protected-route redirects, and the initial OAuth request
(including its PKCE cookies). Full Google authentication and signed-in admin
mutations still require an authenticated end-to-end check.
