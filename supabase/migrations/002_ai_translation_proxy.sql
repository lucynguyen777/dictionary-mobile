-- Supabase database schema for AI Assistant & Translation Proxy (v1.3.0)

-- User Provider Connections (encrypted client-side keys mapping)
create table if not exists public.user_provider_connections (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  provider text not null,
  purpose text not null,
  display_label text not null default '',
  status text not null default 'active',
  key_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (user_id, id)
);

-- Secret Envelopes (store ciphertext for provider connections)
create table if not exists public.user_provider_secret_envelopes (
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id text not null,
  algorithm text not null,
  nonce text not null,
  ciphertext text not null,
  key_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  rotated_at timestamptz,
  revoked_at timestamptz,
  primary key (user_id, connection_id),
  foreign key (user_id, connection_id) references public.user_provider_connections(user_id, id) on delete cascade
);

-- Usage tracking events (redacts actual texts, only tracks counts/meta)
create table if not exists public.proxy_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null,
  provider text not null,
  request_id_hash text,
  input_size integer not null,
  output_size integer not null,
  status text not null,
  error_code text,
  created_at timestamptz not null default now()
);

-- User-owned translation glossaries
create table if not exists public.user_glossaries (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  domain_id text not null default '',
  source_lang text not null,
  target_lang text not null,
  provider text not null default 'deepl',
  provider_glossary_id text,
  entry_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, id)
);

-- Glossary Entries
create table if not exists public.user_glossary_entries (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  glossary_id text not null,
  source_term text not null,
  target_term text not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, id),
  foreign key (user_id, glossary_id) references public.user_glossaries(user_id, id) on delete cascade
);

-- Translation Datasets
create table if not exists public.translation_datasets (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  domain_id text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, id)
);

-- Translation Dataset Entries (source-target sentence pairs/terms)
create table if not exists public.translation_dataset_entries (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  dataset_id text not null,
  source_text text not null,
  target_text text not null,
  type text not null default 'term',
  domain_id text not null default '',
  tags jsonb not null default '[]'::jsonb,
  confidence double precision not null default 1.0,
  source_document_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, id),
  foreign key (user_id, dataset_id) references public.translation_datasets(user_id, id) on delete cascade
);

-- Translation Dataset Documents
create table if not exists public.translation_dataset_documents (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  title text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, id)
);

-- Translation Context Agents
create table if not exists public.translation_context_agents (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  domain_id text not null default '',
  system_instruction text,
  retrieval_settings jsonb not null default '{}'::jsonb,
  connection_id text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, id),
  foreign key (user_id, connection_id) references public.user_provider_connections(user_id, id) on delete set null
);

-- Translation Agent Usage Events
create table if not exists public.translation_agent_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_id text not null,
  tokens_used integer not null default 0,
  created_at timestamptz not null default now()
);

-- Indexes for performance & query optimizations
create index if not exists user_provider_connections_status_idx on public.user_provider_connections(user_id, status);
create index if not exists proxy_usage_events_user_created_idx on public.proxy_usage_events(user_id, created_at);
create index if not exists user_glossaries_updated_idx on public.user_glossaries(user_id, updated_at);
create index if not exists user_glossary_entries_glossary_idx on public.user_glossary_entries(user_id, glossary_id);
create index if not exists translation_datasets_updated_idx on public.translation_datasets(user_id, updated_at);
create index if not exists translation_dataset_entries_dataset_idx on public.translation_dataset_entries(user_id, dataset_id);
create index if not exists translation_context_agents_active_idx on public.translation_context_agents(user_id, active);

-- Enable Row Level Security (RLS) on all tables
alter table public.user_provider_connections enable row level security;
alter table public.user_provider_secret_envelopes enable row level security;
alter table public.proxy_usage_events enable row level security;
alter table public.user_glossaries enable row level security;
alter table public.user_glossary_entries enable row level security;
alter table public.translation_datasets enable row level security;
alter table public.translation_dataset_entries enable row level security;
alter table public.translation_dataset_documents enable row level security;
alter table public.translation_context_agents enable row level security;
alter table public.translation_agent_usage_events enable row level security;

-- Setup RLS policies (only owner user_id can access)
create policy user_provider_connections_all_own on public.user_provider_connections for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy user_provider_secret_envelopes_all_own on public.user_provider_secret_envelopes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy proxy_usage_events_all_own on public.proxy_usage_events for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy user_glossaries_all_own on public.user_glossaries for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy user_glossary_entries_all_own on public.user_glossary_entries for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy translation_datasets_all_own on public.translation_datasets for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy translation_dataset_entries_all_own on public.translation_dataset_entries for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy translation_dataset_documents_all_own on public.translation_dataset_documents for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy translation_context_agents_all_own on public.translation_context_agents for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy translation_agent_usage_events_all_own on public.translation_agent_usage_events for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
