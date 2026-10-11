-- Server-assigned change timestamps for Cloud Sync pull cursors.
-- Clients set updated_at from their own clocks, so a device with a slow clock could write rows "in the past"
-- that other devices' updated_at cursors would skip. synced_at is set by the database on every write.

create or replace function public.set_synced_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.synced_at := clock_timestamp();
  return new;
end;
$$;

do $$
declare
  sync_table text;
begin
  foreach sync_table in array array[
    'user_profiles', 'library_folders', 'saved_words', 'saved_word_folders', 'search_history',
    'flashcards', 'deleted_entities', 'reader_documents', 'reader_settings'
  ]
  loop
    execute format('alter table public.%I add column if not exists synced_at timestamptz not null default now()', sync_table);
    execute format('create index if not exists %I on public.%I (user_id, synced_at)', sync_table || '_synced_at_idx', sync_table);
    execute format('drop trigger if exists %I on public.%I', sync_table || '_set_synced_at', sync_table);
    execute format(
      'create trigger %I before insert or update on public.%I for each row execute function public.set_synced_at()',
      sync_table || '_set_synced_at',
      sync_table
    );
  end loop;
end;
$$;

-- Flashcard completion state syncs across devices.
alter table public.flashcards add column if not exists final_status text;
alter table public.flashcards add column if not exists completed_at timestamptz;
