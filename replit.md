# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### LawnRX (`artifacts/lawn-iq`, web, `/`)
Mobile-first React+Vite app for AI-powered lawn diagnosis. Users upload a photo, fill in problem details (issue appearance, grass type, free-text description), and receive a real OpenAI Vision (gpt-5.4) analysis with health score, severity, advice tiles, and a step-by-step recovery plan. Plans can be saved, listed with aggregate summary, viewed in detail, and deleted.

- Frontend pages: Diagnose (`/`), My Plans (`/plans`), Plan Detail (`/plans/:id`), Care Alerts (`/care-alerts`), About (`/about`).
- API: `POST /diagnoses` (analyze), `POST /diagnoses/save`, `GET /diagnoses`, `GET /diagnoses/:id`, `DELETE /diagnoses/:id`, `GET /diagnoses/summary`.
- Stripe API: `GET /stripe/subscription`, `GET /stripe/products`, `POST /stripe/checkout`, `POST /stripe/portal`, `POST /stripe/webhook`.
- DB: `diagnoses` table in `lib/db/src/schema/diagnoses.ts`. `usersTable` has `stripeCustomerId` + `stripeSubscriptionId` columns.
- AI: `gpt-5.4` via `@workspace/integrations-openai-ai-server`, JSON-schema response_format, photo passed as base64 data URL, body limit bumped to 20mb.
- Auth: Replit Auth (OIDC). Sign-in gate wraps the app via `@workspace/replit-auth-web`'s `useAuth()`. All `/diagnoses` routes require auth and scope rows by `userId` foreign key on the `diagnoses` table.
- Payments: Stripe integration via Replit connector (`conn_stripe_01KQ8BDWS8B85QXQF2TR3D5RRR`). `stripe-replit-sync` manages the `stripe` schema (30 tables). Pro plan = "LawnRX Pro" at $19.99/month (`price_1TQwCDERekY96iVDsiq6N9Ol`). Pro users bypass the 5-analysis free limit. Upgrade modal and Stripe Checkout, billing portal via Customer Portal.
- Stripe initialization: `initStripe()` on startup calls `runMigrations` → `getStripeSync` → `findOrCreateManagedWebhook` → `syncBackfill` (async). Webhook route registered before `express.json()` for raw Buffer payload.
- Seed script: `scripts/seed-stripe-products.ts` (run once via tsx).
