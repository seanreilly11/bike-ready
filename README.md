# BikeReady

A short preparation course for expats learning to cycle safely in the Netherlands. Users work through scenario-based questions, fix mistakes in a Review queue, and test themselves in a final Test.

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy the following into `.env.local` and fill in your values.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PRICE_ID=

NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

NEXT_PUBLIC_SITE_URL=https://bikeready.nl
```

### 3. Set up the database

Run `supabase/schema.sql` against your Supabase project to create the required tables and policies.

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
npx tsc --noEmit   # TypeScript check
```
