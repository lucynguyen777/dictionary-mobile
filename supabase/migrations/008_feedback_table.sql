-- Authenticated, user-owned feedback intake. Email notification remains optional.

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('bug', 'feature', 'content', 'other')),
  message text not null check (char_length(message) between 10 and 4000),
  context text not null default '' check (char_length(context) <= 1000),
  status text not null default 'new' check (status in ('new', 'reviewing', 'resolved', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists feedback_user_created_idx on public.feedback(user_id, created_at desc);
create index if not exists feedback_status_created_idx on public.feedback(status, created_at desc);

alter table public.feedback enable row level security;

create policy feedback_select_own on public.feedback
  for select to authenticated
  using (auth.uid() = user_id);

create policy feedback_insert_own on public.feedback
  for insert to authenticated
  with check (auth.uid() = user_id);

grant select, insert on table public.feedback to authenticated;

comment on table public.feedback is
  'User-owned feedback intake. Operational retention and optional Resend notification are configured separately.';
