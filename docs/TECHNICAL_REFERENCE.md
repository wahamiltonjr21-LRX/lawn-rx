# LawnRX Technical Reference

## Table of Contents
1. [Frontend](#frontend)
2. [Backend](#backend)
3. [Authentication](#authentication)
4. [Database](#database)
5. [Storage](#storage)

---

## Frontend

### React Version
**React 19.1.0** (pinned in `pnpm-workspace.yaml` catalog)

### Build Commands

| Command | Script | Purpose |
|---|---|---|
| `pnpm run build` | `vite build --config vite.config.ts` | Production web build |
| `pnpm run build:cap` | `vite build --config vite.config.cap.ts` | Capacitor (Android) build |
| `pnpm run build:cap:test` | `vite build --config vite.config.cap.test.ts` | Capacitor test build |
| `pnpm run dev` | `vite --config vite.config.ts` | Local development server |

Artifact directory: `artifacts/lawn-iq/`

### Environment Variables

| Variable | Description | Where used |
|---|---|---|
| `VITE_API_BASE` | Base URL for API requests (e.g. `/api`) | `main.tsx`, `use-subscription.ts`, `tip-of-the-day.tsx`, `embedded-checkout-modal.tsx` |
| `VITE_MAPBOX_TOKEN` | Mapbox public access token for yard mapping | `mapbox-yard-map.tsx` |
| `VITE_TEST_BUILD` | Set to `"true"` to enable test/dev features (skip photo upload, etc.) | `pages/home.tsx` |
| `BASE_URL` | Built-in Vite variable for the app's base path (set by the Replit proxy) | `App.tsx` |

> The Stripe publishable key is **not** a Vite env var — it is fetched at runtime from `GET /api/stripe/config` to avoid baking it into the bundle.

---

## Backend

Artifact directory: `artifacts/api-server/`  
All routes are prefixed with `/api`.

### Express Routes

#### Authentication — `routes/auth.ts`

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/auth/user` | Returns the current authenticated user |
| `GET` | `/api/login` | Initiates OIDC login flow (web) |
| `GET` | `/api/callback` | OIDC redirect callback (web) |
| `GET` | `/api/logout` | Clears session and logs out |
| `GET` | `/api/mobile-auth/begin` | Starts native mobile OAuth flow |
| `GET` | `/api/mobile-callback` | Callback for mobile OAuth |
| `GET` | `/api/mobile-auth/poll` | Polls for completed mobile login |
| `POST` | `/api/mobile-auth/token-exchange` | Exchanges auth code for session token (mobile) |
| `POST` | `/api/mobile-auth/activate-cookie` | Activates session cookie for native clients |
| `POST` | `/api/mobile-auth/logout` | Mobile-specific logout |

#### Diagnoses — `routes/diagnoses.ts`

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/diagnoses` | Run AI analysis on a lawn photo (GPT-4o) |
| `GET` | `/api/diagnoses` | List all saved diagnoses for the user |
| `GET` | `/api/diagnoses/usage` | Get analysis count and free-tier limit status |
| `GET` | `/api/diagnoses/summary` | Aggregate stats across user's diagnoses |
| `POST` | `/api/diagnoses/save` | Save a diagnosis result to the database |
| `GET` | `/api/diagnoses/:id` | Get a single diagnosis by ID |
| `DELETE` | `/api/diagnoses/:id` | Delete a diagnosis |

#### Community — `routes/community.ts`

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/community` | List all community posts |
| `POST` | `/api/community` | Create a new community post |
| `DELETE` | `/api/community/:id` | Delete a post |
| `GET` | `/api/community/:id/comments` | List comments on a post |
| `POST` | `/api/community/:id/comments` | Add a comment to a post |
| `DELETE` | `/api/community/comments/:commentId` | Delete a comment |

#### Stripe / Billing — `routes/stripe.ts`

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/stripe/config` | Returns the Stripe publishable key |
| `GET` | `/api/stripe/products` | Lists available plans and prices |
| `GET` | `/api/stripe/subscription` | Returns current user's Pro status and subscription |
| `POST` | `/api/stripe/checkout` | Creates a Checkout Session (redirect flow) |
| `POST` | `/api/stripe/embedded-checkout` | Creates a Checkout Session (embedded flow) |
| `POST` | `/api/stripe/portal` | Creates a Customer Portal session |
| `POST` | `/api/stripe/webhook` | Stripe webhook receiver (registered before `express.json()`) |

#### Treatment Logs — `routes/treatments.ts`

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/treatments` | List treatment history for the user |
| `POST` | `/api/treatments` | Log a new treatment activity |
| `DELETE` | `/api/treatments/:id` | Delete a treatment log entry |

#### User Profile — `routes/user.ts`

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/user/profile` | Get profile settings (nickname, yard size) |
| `PUT` | `/api/user/profile` | Update profile settings |
| `DELETE` | `/api/user/me` | Delete account and session |

#### Miscellaneous

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/healthz` | Health check |
| `GET` | `/api/tip` | AI-generated lawn care tip of the day (cached) |
| `POST` | `/api/upgrade-request` | Submit a manual Pro upgrade request |
| `GET` | `/api/upgrade-request` | Get status of upgrade request |
| `GET` | `/api/download/android` | Download the Android project ZIP |

---

### OpenAI API Integration

**Library:** `@workspace/integrations-openai-ai-server` (wrapper in `lib/integrations-openai-ai-server/`)  
**Model:** `gpt-4o`  
**Token limit:** `max_completion_tokens: 1800`  
**Image detail:** `low`

#### Prompt Structure

**System prompt** defines the AI persona:
> "LawnRX, a board-certified turfgrass pathologist and agronomist with 20+ years' experience."

Responsibilities include: visual diagnosis (leaf blade color, pattern), differential diagnosis, root-cause identification (naming specific causative agents, e.g. *Rhizoctonia solani*), IPM-first treatment ladder, and prognosis.

**User prompt** passes:
- Photo as a Base64 data URL
- Issue appearance (user-selected)
- Grass type
- Free-text description
- Location / climate context

#### Response Format

Uses OpenAI **Structured Outputs** (`json_schema`, `strict: true`). Key fields returned:

| Field | Type | Description |
|---|---|---|
| `title` | string | Short diagnosis name |
| `severity` | `"Low"` / `"Medium"` / `"High"` | Severity rating |
| `healthScore` | integer 0–100 | Overall lawn health score |
| `confidence` | integer 0–100 | AI confidence (≤50 if photo is blurry) |
| `summary` | string | 3–5 sentence findings and reasoning |
| `causativeAgent` | string | Scientific name of pathogen or pest |
| `estimatedRecovery` | string | Recovery timeline (e.g. "3–5 weeks") |
| `advice` | object | Sections for Soil, Water, Light, and Risk |
| `preventionTips` | string[] | Concrete prevention actions |
| `treatmentProducts` | object[] | Product categories and application instructions |
| `steps` | object[] | 4–7 actionable steps with timing and priority (`"immediate"` / `"soon"` / `"ongoing"`) |

#### Paywall Enforcement

Free tier is capped at **5 analyses** (controlled by `FREE_ANALYSIS_LIMIT` env var, default 5).  
When the limit is hit, `POST /api/diagnoses` returns `403 Forbidden`.  
Pro users bypass the limit — see [Stripe Integration](#stripe-integration) below.

---

### Stripe Integration

**SDK:** `stripe` Node.js library  
**Connector:** Replit Stripe connector (`conn_stripe_01KQ8BDWS8B85QXQF2TR3D5RRR`)  
**Secrets required:** `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`

#### Plans and Prices

| Plan | Price ID | Amount |
|---|---|---|
| LawnRX Pro — Monthly | `price_1TeGEwLXxFjrZzg4DJeb4qw9` | $7.99 / month |
| LawnRX Pro — Annual | `price_1TeGEwLXxFjrZzg41VL3iN6k` | $59.99 / year |

#### Subscription Status Check (`GET /api/stripe/subscription`)

1. **Fast path:** Look up `stripe_subscription_id` on the `users` row and call `stripe.subscriptions.retrieve`.
2. **Fallback:** If missing or invalid, call `stripe.subscriptions.list` for the customer.
3. **Overrides:** A user is Pro if `is_pro_override = true` in the database, or if their email appears in the `PRO_OVERRIDE_EMAILS` environment variable (comma-separated).

#### Webhook Events Handled (`webhookHandlers.ts`)

| Event | Action |
|---|---|
| `checkout.session.completed` | Writes `stripe_subscription_id` to the user's row |
| `customer.subscription.created` | Updates `stripe_subscription_id` if status is `active` or `trialing` |
| `customer.subscription.updated` | Same as above |
| `customer.subscription.deleted` | Sets `stripe_subscription_id` to `null` |

Webhook signature is verified using `STRIPE_WEBHOOK_SECRET`. The webhook route is registered **before** `express.json()` so the raw `Buffer` payload is preserved for signature verification.

#### Webhook Registration

Registered in Stripe Dashboard at:  
`https://lawn-rx.replit.app/api/stripe/webhook`

---

## Authentication

**Provider:** Replit Auth (OpenID Connect with PKCE)  
**Library:** `openid-client`  
**Session store:** PostgreSQL (`sessions` table via `connect-pg-simple`)

### Flow — Web

1. User clicks sign in → opens popup to `GET /api/login?popup=1`
2. Replit OIDC redirects to `GET /api/callback`
3. User is upserted into `users` table (syncs `email`, `first_name`, `last_name`, `profile_image_url`)
4. Session is created in `sessions` table; cookie (`sid`) is set
5. Popup closes; `useAuth` hook detects closure and re-fetches user state

### Flow — Native (Capacitor / Android)

1. Opens `GET /api/mobile-auth/begin` in Chrome Custom Tab
2. After auth, frontend polls `GET /api/mobile-auth/poll` until a session ID is ready
3. Session ID stored in `localStorage` as `lawnrx_cap_sid`
4. All subsequent API calls include `Authorization: Bearer <sid>` header (via `authFetch`)

### Middleware (`middlewares/authMiddleware.ts`)

Runs on every request. Extracts the session ID from either:
- `Authorization: Bearer <sid>` header (native)
- `sid` cookie (web)

Validates the session from the database. If the access token is expired, it automatically refreshes using the stored `refresh_token`. Attaches the user to `req.user`.

### Frontend Hook

`useAuth()` from `@workspace/replit-auth-web` provides:
- `user` — the authenticated user object (or `null`)
- `isAuthenticated` — boolean
- `isLoading` — boolean
- `signIn()` — triggers the appropriate flow (popup or native browser)
- `signOut()` — calls `/api/logout` and clears state

---

## Database

**Engine:** PostgreSQL (Replit managed)  
**ORM:** Drizzle ORM  
**Connection:** `DATABASE_URL` environment variable  
**Schema files:** `lib/db/src/schema/`  
**Push command (dev only):** `pnpm --filter @workspace/db run push`

### Tables

#### `users`
Stores user profiles and subscription state.

| Column | Type | Notes |
|---|---|---|
| `id` | `varchar` PK | Replit OIDC `sub` claim (user ID) |
| `email` | `varchar` UNIQUE | |
| `first_name` | `varchar` | |
| `last_name` | `varchar` | |
| `profile_image_url` | `varchar` | |
| `analysis_count` | `integer` | Lifetime AI analyses run (default 0) |
| `lawn_rx_name` | `varchar(30)` | User's display nickname |
| `yard_square_feet` | `integer` | Yard size for profile |
| `is_pro_override` | `boolean` | Manual Pro flag (default `false`) |
| `stripe_customer_id` | `varchar` | Stripe Customer ID |
| `stripe_subscription_id` | `varchar` | Active Stripe Subscription ID |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | Auto-updates on modification |

#### `sessions`
Managed by `connect-pg-simple` for Replit Auth session storage.

| Column | Type | Notes |
|---|---|---|
| `sid` | `varchar` PK | Session ID |
| `sess` | `jsonb` | Session data (user info, tokens) |
| `expire` | `timestamp` | Expiry timestamp |

Index: `IDX_session_expire` on `expire`.

#### `diagnoses`
AI-generated lawn health reports.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | `randomUUID()` |
| `user_id` | `varchar` FK → `users.id` | Cascade delete |
| `title` | `text` | Diagnosis name |
| `severity` | `text` | `"Low"` / `"Medium"` / `"High"` |
| `health_score` | `integer` | 0–100 |
| `confidence` | `integer` | 0–100 |
| `summary` | `text` | AI summary |
| `steps` | `jsonb` | Array of treatment steps |
| `water_advice` | `text` | |
| `light_advice` | `text` | |
| `risk_advice` | `text` | |
| `grass_type` | `text` | User-provided |
| `issue_appearance` | `text` | User-provided |
| `description` | `text` | User-provided |
| `photo_data_url` | `text` | Base64 data URL of the lawn photo |
| `nickname` | `text` | User's display name at time of save |
| `created_at` | `timestamptz` | |

#### `community_posts`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `varchar` FK → `users.id` | Cascade delete |
| `user_name` | `text` | |
| `user_avatar` | `text` | |
| `caption` | `text` | |
| `photo_data_url` | `text` | Base64 data URL of the post photo |
| `like_count` | `integer` | Default 0 |
| `created_at` | `timestamptz` | |

#### `community_comments`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `post_id` | `uuid` FK → `community_posts.id` | Cascade delete |
| `user_id` | `varchar` FK → `users.id` | Cascade delete |
| `user_name` | `text` | |
| `user_avatar` | `text` | |
| `content` | `text` | |
| `created_at` | `timestamptz` | |

#### `treatment_logs`
Tracks completed lawn care actions.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `varchar` FK → `users.id` | Cascade delete |
| `plan_id` | `uuid` FK → `diagnoses.id` | Set null on delete |
| `plan_title` | `text` | |
| `step_title` | `text` | |
| `treatment_type` | `text` | |
| `scheduled_date` | `timestamptz` | |
| `completed_at` | `timestamptz` | |
| `notes` | `text` | |
| `product_used` | `text` | |

#### `upgrade_requests`
Manual Pro upgrade requests.

| Column | Type | Notes |
|---|---|---|
| `id` | `varchar` PK | |
| `user_id` | `varchar` FK → `users.id` | Cascade delete |
| `message` | `varchar(1000)` | |
| `status` | `enum` | `"pending"` / `"fulfilled"` |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

---

## Storage

### Where Photos Are Stored

**All photos are stored directly in the PostgreSQL database** as Base64-encoded data URLs in `text` columns — there is no S3 bucket, object storage, or filesystem involved.

| Table | Column | Content |
|---|---|---|
| `diagnoses` | `photo_data_url` | Lawn photo submitted for AI diagnosis |
| `community_posts` | `photo_data_url` | Photo attached to a community post |

### How It Works

1. User selects a photo on the frontend.
2. The image is encoded as a Base64 data URL in the browser.
3. The data URL is sent in the JSON request body to `POST /api/diagnoses` (body size limit is **20 MB**).
4. The API forwards the Base64 string to OpenAI Vision for analysis.
5. After analysis, the data URL is saved to the `diagnoses` table so the user can view their history.

### Implications

- **No external storage dependency** — photos live entirely within the Replit PostgreSQL instance.
- **Database size:** Each high-resolution photo adds ~100–500 KB to the database.
- **No CDN caching** — photos are served by fetching the raw data URL from the database on each request.
- **Future consideration:** Moving photos to object storage (e.g. Replit Object Storage / S3) and storing only a URL in the database would reduce database size and improve load times for the community feed and plan history.
