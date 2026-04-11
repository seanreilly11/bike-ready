-- BikeReady database schema
-- All tables have Row Level Security enabled.
-- Users can only access their own rows.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table if not exists profiles (
  id                  uuid        primary key references auth.users(id) on delete cascade,
  is_premium          boolean     not null default false,
  premium_since       timestamptz,
  stripe_customer_id  text,
  stripe_payment_id   text,
  created_at          timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can read their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Auto-create profile on user sign-up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- question_progress
-- ---------------------------------------------------------------------------

create table if not exists question_progress (
  id               uuid         primary key default gen_random_uuid(),
  user_id          uuid         not null references profiles(id) on delete cascade,
  question_id      text         not null,
  seen             boolean      not null default false,
  correct          boolean      not null default false,
  attempts         integer      not null default 0,
  last_answered_at timestamptz  not null default now(),
  unique (user_id, question_id)
);

alter table question_progress enable row level security;

create policy "Users can read their own progress"
  on question_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert their own progress"
  on question_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own progress"
  on question_progress for update
  using (auth.uid() = user_id);

-- Upsert helper: correct is OR'd — never reverts once true
create or replace function public.upsert_question_progress(
  p_user_id     uuid,
  p_question_id text,
  p_correct     boolean
) returns void as $$
begin
  insert into question_progress (user_id, question_id, seen, correct, attempts, last_answered_at)
  values (p_user_id, p_question_id, true, p_correct, 1, now())
  on conflict (user_id, question_id) do update set
    correct          = question_progress.correct or excluded.correct,
    attempts         = question_progress.attempts + 1,
    seen             = true,
    last_answered_at = now();
end;
$$ language plpgsql security definer;

-- ---------------------------------------------------------------------------
-- badges
-- ---------------------------------------------------------------------------

create table if not exists badges (
  id        uuid         primary key default gen_random_uuid(),
  user_id   uuid         not null references profiles(id) on delete cascade,
  badge_id  text         not null,
  earned_at timestamptz  not null default now(),
  unique (user_id, badge_id)
);

alter table badges enable row level security;

create policy "Users can read their own badges"
  on badges for select
  using (auth.uid() = user_id);

create policy "Users can insert their own badges"
  on badges for insert
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- test_results
-- ---------------------------------------------------------------------------

create table if not exists test_results (
  id           uuid         primary key default gen_random_uuid(),
  user_id      uuid         not null references profiles(id) on delete cascade,
  score_pct    integer      not null check (score_pct >= 0 and score_pct <= 100),
  answers      jsonb        not null default '{}'::jsonb,
  passed       boolean      not null default false,
  completed_at timestamptz  not null default now()
);

alter table test_results enable row level security;

create policy "Users can read their own test results"
  on test_results for select
  using (auth.uid() = user_id);

create policy "Users can insert their own test results"
  on test_results for insert
  with check (auth.uid() = user_id);
