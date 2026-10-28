# Argania storefront

The customer storefront runs on [Vinext](https://vinext.dev/) and Vite on
Cloudflare Workers with React Server Components. The existing App Router routes, server actions,
`proxy.ts`, and `next/*` imports are supported by Vinext at runtime.
The admin application also runs on Vinext/Vite, on port 3001.

Live storefront: <https://argania-storefront.faraz2711.workers.dev>.

## Development

Use Node.js 24 or newer and the workspace's pinned pnpm version. From `Webstore/`:

```sh
pnpm install
pnpm --filter @webstore/storefront dev
```

Open <http://localhost:3000>. Commands load shared configuration from
`Webstore/.env` (including the usual mode-specific `.env` variants) before
starting Vite, so public Supabase configuration is available during compilation
and server configuration is available to the proxy and route handlers.
See `Webstore/.env.example` for the supported variables. Never put service keys
or payment secrets in `NEXT_PUBLIC_*` variables.

## Production and checks

From `Webstore/`:

```sh
pnpm --filter @webstore/storefront check-types
pnpm --filter @webstore/storefront lint
pnpm --filter @webstore/storefront build
pnpm --filter @webstore/storefront start
pnpm --filter @webstore/storefront run deploy
```

`build` creates Cloudflare Build Output in `apps/storefront/.cloudflare/output/`.
`start` previews the built Worker locally; pass `--port 3000` to choose a port.
`cloudflare.config.ts` defines the `argania-storefront` Worker, its runtime-secret
bindings, and static assets. Optional paid cache and image services are disabled.

Before deploying, authenticate to your own Cloudflare account:

```sh
pnpm --filter @webstore/storefront exec cf auth login
pnpm --filter @webstore/storefront run deploy
```

For CI, set `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
The deploy command builds the Worker and uploads only the storefront variables
listed in `scripts/deploy-cloudflare.mjs` as Cloudflare secrets. It uses a
temporary file restricted to the current user and removes it after deployment.
Secrets are uploaded with the Worker version, rather than embedded in source.
To deploy an already validated build, pass `--prebuilt`.
Public `NEXT_PUBLIC_*` values are also compiled into browser assets, as expected.

After the first deployment, add the deployed `/auth/callback` URL to Supabase's
allowed redirect URLs before testing Google sign-in. If enabling Razorpay's
optional webhook, set `RAZORPAY_WEBHOOK_SECRET` and configure the deployed
`/api/webhooks/razorpay` endpoint in Razorpay.

Type checking runs `vinext typegen` before TypeScript. Vinext generates
`next-env.d.ts` and `.next/types/routes.d.ts`; these are disposable artifacts.
Cloudflare generates Worker types in `.cloudflare/types/` during builds and dev.
The `next` dependency remains for compatible API types, and `@next/env` loads
the shared workspace environment. Next.js does not run dev, build, or start.

`vite.config.ts` configures Vinext, stable CSS-module names shared by server and
client builds, and a single React instance for workspace UI components.
The storefront's `turbo.json` caches the build output and tracks shared environment files.

The migration was checked with Vinext's compatibility scanner, a production
build, TypeScript, ESLint, local route requests, and browser interaction.
Authenticated checkout, OAuth completion, payment settlement, and shipping
creation still require end-to-end testing with the appropriate test accounts
and service configuration.

## Delivery-price checks

Checkout customers can check their delivery charge using a six-digit PIN code
before submitting the full address. The server calculates parcel weight and value
from the signed-in customer's current cart; it does not accept prices from the
browser. Order preparation obtains a fresh quote before saving the payable total.
Shiprocket requests send explicit JSON headers and identify the storefront API
client, including when running on Cloudflare Workers. Provider HTTP errors stay
in server diagnostics; credentials and full delivery addresses are not logged.

Run the storefront regression suite with Node.js 24 or newer:

```sh
node --test apps/storefront/tests/*.test.mjs
```
