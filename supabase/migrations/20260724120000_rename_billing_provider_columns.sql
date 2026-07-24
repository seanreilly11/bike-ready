-- Rename Stripe-specific billing columns to provider-neutral names for the
-- Paddle migration.
alter table public.profiles rename column stripe_customer_id to provider_customer_id;
alter table public.profiles rename column stripe_payment_id  to provider_transaction_id;

-- Existing values are Stripe cus_/pi_ ids, meaningless to Paddle. Clear them so a
-- fresh Paddle checkout never reuses a Stripe id. is_premium is preserved: anyone
-- already paid keeps lifetime access and never re-checks out.
update public.profiles
  set provider_customer_id = null, provider_transaction_id = null;
