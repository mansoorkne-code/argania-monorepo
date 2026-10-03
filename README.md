# argania-monorepo
## monorepo structure
```
webstore/
│
├── apps/
│   ├── storefront/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   │
│   └── admin/
│       ├── app/
│       ├── components/
│       └── lib/
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
└── README.md
```
## Development structure

```
                    ┌───────────────┐
                    │   Supabase    │
                    │ DB + Auth +   │
                    │ Storage + RLS │
                    └───────┬───────┘
                            │
                    ┌───────▼───────┐
                    │ packages/db   │
                    │ packages/api  │
                    │ validations   │
                    └───────┬───────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
       ┌──────▼──────┐             ┌──────▼──────┐
       │ Storefront  │             │    Admin    │
       │    Next.js  │             │   Next.js   │
       └──────┬──────┘             └──────┬──────┘
              │                           │
              └─────────────┬─────────────┘
                            │
                       packages/ui
```
