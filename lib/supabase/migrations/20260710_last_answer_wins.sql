-- Last answer wins: missing a previously-correct question puts it back in
-- the review queue. Replaces the sticky-correct upsert.
create or replace function public.upsert_question_progress(
  p_question_id text,
  p_correct     boolean
) returns void as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  insert into question_progress (user_id, question_id, seen, correct, attempts, last_answered_at)
  values (auth.uid(), p_question_id, true, p_correct, 1, now())
  on conflict (user_id, question_id) do update set
    correct          = excluded.correct,
    attempts         = question_progress.attempts + 1,
    seen             = true,
    last_answered_at = now();
end;
$$ language plpgsql security definer;
