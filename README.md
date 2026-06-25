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
NEXT_PUBLIC_SUPABASE_REDIRECT_URL=http://localhost:3000

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PRICE_ID=

NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=

NEXT_PUBLIC_SITE_URL=https://cycledutch.com
```

Stripe, PostHog and Sentry vars are required on production builds (enforced by `lib/validateEnv.ts`); local dev runs without them.

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

Set all production environment variables in the Vercel project settings (the Sentry/Stripe/PostHog vars above are required there). Configure the Stripe webhook endpoint to `https://<your-domain>/api/stripe/webhook` and add the signing secret as `STRIPE_WEBHOOK_SECRET`. `/api/health` returns `200` for uptime monitoring.
