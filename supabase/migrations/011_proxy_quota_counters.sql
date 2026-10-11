-- Durable per-user quota counters for the backend proxy (plan task 0.4).
-- The in-memory tracker resets on every serverless cold start and is not shared between instances,
-- so limits are enforced here with one atomic check-and-increment per request.

create table if not exists public.proxy_quota_counters (
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null check (feature in ('translation', 'ai-chat')),
  period text not null check (period in ('day', 'month')),
  period_key text not null,
  used bigint not null default 0 check (used >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, feature, period, period_key)
);

alter table public.proxy_quota_counters enable row level security;

-- Owners may read their usage; only the backend (service role) changes it.
drop policy if exists proxy_quota_counters_select_own on public.proxy_quota_counters;
create policy proxy_quota_counters_select_own on public.proxy_quota_counters
  for select to authenticated using (auth.uid() = user_id);
revoke all on table public.proxy_quota_counters from anon, authenticated;
grant select on table public.proxy_quota_counters to authenticated;
grant select, insert, update, delete on table public.proxy_quota_counters to service_role;

-- Checks both windows and increments them only when neither limit would be exceeded.
-- Rows are locked day-then-month so concurrent calls for one user serialize without deadlocks.
create or replace function public.consume_proxy_quota(
  p_user_id uuid,
  p_feature text,
  p_amount bigint,
  p_day_key text,
  p_daily_limit bigint,
  p_month_key text,
  p_monthly_limit bigint
)
returns table (allowed boolean, exceeded text, daily_used bigint, monthly_used bigint)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_daily bigint;
  v_monthly bigint;
begin
  if p_amount < 0 then
    raise exception 'quota amount must not be negative';
  end if;

  insert into public.proxy_quota_counters (user_id, feature, period, period_key)
  values (p_user_id, p_feature, 'day', p_day_key), (p_user_id, p_feature, 'month', p_month_key)
  on conflict do nothing;

  select used into v_daily from public.proxy_quota_counters
  where user_id = p_user_id and feature = p_feature and period = 'day' and period_key = p_day_key
  for update;
  select used into v_monthly from public.proxy_quota_counters
  where user_id = p_user_id and feature = p_feature and period = 'month' and period_key = p_month_key
  for update;

  if v_daily + p_amount > p_daily_limit then
    return query select false, 'daily'::text, v_daily, v_monthly;
    return;
  end if;
  if v_monthly + p_amount > p_monthly_limit then
    return query select false, 'monthly'::text, v_daily, v_monthly;
    return;
  end if;

  update public.proxy_quota_counters
  set used = used + p_amount, updated_at = now()
  where user_id = p_user_id and feature = p_feature
    and ((period = 'day' and period_key = p_day_key) or (period = 'month' and period_key = p_month_key));

  return query select true, null::text, v_daily + p_amount, v_monthly + p_amount;
end;
$$;

revoke all on function public.consume_proxy_quota(uuid, text, bigint, text, bigint, text, bigint) from public, anon, authenticated;
grant execute on function public.consume_proxy_quota(uuid, text, bigint, text, bigint, text, bigint) to service_role;
