# CycleDutch

A short preparation course for expats learning to cycle safely in the Netherlands. Users work through scenario-based questions, fix mistakes in a Review queue, and test themselves in a final Test.

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy `.env.local.example` to `.env.local` and fill in your values.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=

PADDLE_ENV=sandbox
PADDLE_API_KEY=
PADDLE_WEBHOOK_SECRET=
PADDLE_PRICE_ID=
NEXT_PUBLIC_PADDLE_ENV=sandbox
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=

NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=

NEXT_PUBLIC_SITE_URL=https://cycledutch.com
```

PostHog and Sentry vars are required on production builds; the Paddle vars are required when premium is enabled on production (all enforced by `lib/validateEnv.ts`). Local dev runs without them. `PADDLE_ENV` and `NEXT_PUBLIC_PADDLE_ENV` must match.

### 3. Set up the database

Run `lib/supabase/schema.sql` against your Supabase project to create the required tables and policies.

In the Supabase dashboard, add your local and production URLs to the Redirect URLs list under Authentication → URL Configuration.

### 4. Run the dev server

```bash
npm run dev
```

---

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run lint       # ESLint
npm run typecheck  # TypeScript check
npm run test:run   # Run the test suite once
```

---

## Deployment

The app is built for Vercel. Push to `main` triggers a production deploy; pull requests get preview deployments. CI (`.github/workflows/ci.yml`) runs lint, typecheck, tests and a build on every push and must pass before merge.

Set all production environment variables in the Vercel project settings (the Sentry/Paddle/PostHog vars above are required there when premium is enabled). In the Paddle dashboard, create a Notifications destination pointing at `https://<your-domain>/api/paddle/webhook` (subscribed to `transaction.completed` and `transaction.paid`) and add its signing secret as `PADDLE_WEBHOOK_SECRET`; also approve the production domain under Checkout → Website approval. `/api/health` returns `200` for uptime monitoring.
