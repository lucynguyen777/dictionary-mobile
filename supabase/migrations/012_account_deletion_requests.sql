-- Account deletion groundwork (plan 2.6). Owner decision D3 picks the mode with the backend env
-- ACCOUNT_DELETION_MODE: "immediate" deletes the auth user at once; "scheduled" records a request
-- here and the backend purges it after the grace period. Deleting the auth user cascades to every
-- user table (tests/accountDeletionCascade.test.ts).

create table if not exists public.account_deletion_requests (
  user_id uuid primary key references auth.users(id) on delete cascade,
  requested_at timestamptz not null default now(),
  purge_after timestamptz not null
);

alter table public.account_deletion_requests enable row level security;

-- Server-only: the backend (service role) reads and writes requests; clients go through it.
revoke all on table public.account_deletion_requests from anon, authenticated;
grant select, insert, update, delete on table public.account_deletion_requests to service_role;

-- Deletes the auth users whose grace period has ended and returns how many were removed.
create or replace function public.purge_due_account_deletions()
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_count integer;
begin
  delete from auth.users
  where id in (select user_id from public.account_deletion_requests where purge_after <= now());
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.purge_due_account_deletions() from public, anon, authenticated;
grant execute on function public.purge_due_account_deletions() to service_role;
