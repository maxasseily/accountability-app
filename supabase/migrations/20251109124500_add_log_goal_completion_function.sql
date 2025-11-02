-- Function to log a goal completion and update user statistics atomically
create or replace function public.log_goal_completion(user_uuid uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  goal_record public.user_goals%rowtype;
  stats_record public.user_statistics%rowtype;
  now_ts timestamptz := timezone('utc', now());
  today date := now_ts::date;
  current_week_start timestamptz := date_trunc('week', now_ts);
  new_completion_dates date[];
  new_progress integer;
  needs_reset boolean;
begin
  if user_uuid is null then
    raise exception 'User id must be provided' using errcode = 'P0001';
  end if;

  if auth.uid() is distinct from user_uuid then
    raise exception 'Cannot modify goal for another user' using errcode = 'P0001';
  end if;

  select *
    into goal_record
    from public.user_goals
    where user_id = user_uuid
    for update;

  if not found then
    raise exception 'Goal not found' using errcode = 'P0001';
  end if;

  if goal_record.last_completion_date = today then
    raise exception 'Already logged a run today' using errcode = 'P0001';
  end if;

  needs_reset := goal_record.week_start_date is null or current_week_start > goal_record.week_start_date;

  if needs_reset then
    new_progress := 1;
    new_completion_dates := array[today];
  else
    new_progress := least(goal_record.current_progress + 1, goal_record.frequency);
    new_completion_dates := coalesce(goal_record.completion_dates, '{}'::date[]);
    new_completion_dates := array_append(new_completion_dates, today);
  end if;

  update public.user_goals
     set current_progress   = new_progress,
         week_start_date    = case when needs_reset then current_week_start else goal_record.week_start_date end,
         last_completion_date = today,
         completion_dates   = new_completion_dates,
         updated_at         = now_ts
   where user_id = user_uuid
   returning * into goal_record;

  insert into public.user_statistics (user_id)
  values (user_uuid)
  on conflict (user_id) do nothing;

  update public.user_statistics
     set lifetime_goals_logged = lifetime_goals_logged + 1,
         credibility           = least(credibility + 1, 100),
         updated_at            = now_ts
   where user_id = user_uuid
   returning * into stats_record;

  return jsonb_build_object(
    'goal', to_jsonb(goal_record),
    'statistics', to_jsonb(stats_record)
  );
end;
$$;

grant execute on function public.log_goal_completion(uuid) to authenticated;
