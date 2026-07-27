-- Rename Stripe-specific billing columns to provider-neutral names for the
-- Paddle migration.
alter table public.profiles rename column stripe_customer_id to provider_customer_id;
alter table public.profiles rename column stripe_payment_id  to provider_transaction_id;

-- Existing values are Stripe cus_/pi_ ids, meaningless to Paddle. Clear them so a
-- fresh Paddle checkout never reuses a Stripe id. is_premium is preserved: anyone
-- already paid keeps lifetime access and never re-checks out.
update public.profiles
  set provider_customer_id = null, provider_transaction_id = null;

-- A Paddle customer maps to at most one profile, so the grant/reconcile paths can
-- safely resolve the account with .single() on provider_customer_id. Partial:
-- free users have a null id.
create unique index if not exists profiles_provider_customer_id_key
  on public.profiles (provider_customer_id)
  where provider_customer_id is not null;
