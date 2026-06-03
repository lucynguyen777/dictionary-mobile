-- Additive migration: specialized translation dataset agents.
-- The canonical table/key shape is created in 002_ai_translation_proxy.sql.
-- This migration must not recreate translation dataset tables with UUID-only ids.

alter table public.translation_datasets
  add column if not exists description text;

alter table public.translation_dataset_entries
  add column if not exists validation_state text not null default 'valid',
  add column if not exists conflict_with_id text,
  add column if not exists revision_history jsonb not null default '[]'::jsonb;

alter table public.translation_dataset_documents
  add column if not exists dataset_id text,
  add column if not exists file_name text,
  add column if not exists file_type text,
  add column if not exists file_size integer;

alter table public.translation_context_agents
  add column if not exists description text,
  add column if not exists is_archived boolean not null default false,
  add column if not exists dataset_ids jsonb not null default '[]'::jsonb,
  add column if not exists user_provider_connection_id text,
  add column if not exists daily_token_usage integer not null default 0,
  add column if not exists monthly_token_usage integer not null default 0;

create index if not exists translation_dataset_entries_validation_idx
  on public.translation_dataset_entries(user_id, validation_state);

create index if not exists translation_dataset_documents_dataset_idx
  on public.translation_dataset_documents(user_id, dataset_id);

create index if not exists translation_context_agents_archive_idx
  on public.translation_context_agents(user_id, is_archived);
