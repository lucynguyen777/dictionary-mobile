-- Supabase Cloud Sync MVP schema draft.
-- Runtime sync remains disabled until local metadata and fake-client tests are added.

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  local_profile_id text not null default 'local-profile',
  display_name text not null default '',
  email text not null default '',
  username text not null default '',
  phone text not null default '',
  avatar_url text not null default '',
  native_language text not null,
  learning_language text not null,
  proficiency_level text not null,
  learning_goal text not null,
  timezone text not null,
  daily_goal text not null,
  notification_preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table if not exists public.library_folders (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  color text not null,
  color_note text not null default '',
  tags jsonb not null default '[]'::jsonb,
  avatar_uri text not null default '',
  is_favorite boolean not null default false,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  version integer not null default 1,
  primary key (user_id, id)
);

create table if not exists public.saved_words (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  word text not null,
  ipa text not null default '',
  definition text not null default '',
  audio text not null default '',
  note text not null default '',
  tags jsonb not null default '[]'::jsonb,
  source text not null default '',
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  version integer not null default 1,
  primary key (user_id, id)
);

create table if not exists public.saved_word_folders (
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id text not null,
  folder_id text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  version integer not null default 1,
  primary key (user_id, word_id, folder_id)
);

create table if not exists public.search_history (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  word text not null,
  normalized_word text not null,
  looked_up_at timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  version integer not null default 1,
  primary key (user_id, id)
);

create table if not exists public.flashcards (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  word_id text not null,
  type text not null,
  front text not null,
  back text not null,
  review_state text not null,
  interval integer not null,
  repetition integer not null,
  efactor double precision not null,
  due_date timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  version integer not null default 1,
  primary key (user_id, id)
);

create table if not exists public.deleted_entities (
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  deleted_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  primary key (user_id, entity_type, entity_id)
);

create table if not exists public.reader_documents (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  title text not null,
  content text not null,
  source_format text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  version integer not null default 1,
  primary key (user_id, id)
);

create table if not exists public.reader_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  local_settings_id text not null default 'local-reader-settings',
  selected_document_id text,
  font_size integer not null,
  font_family text not null,
  background_color text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null,
  deleted_at timestamptz,
  version integer not null default 1
);

create index if not exists library_folders_updated_idx on public.library_folders(user_id, updated_at);
create index if not exists saved_words_word_idx on public.saved_words(user_id, word);
create index if not exists saved_words_updated_idx on public.saved_words(user_id, updated_at);
create index if not exists saved_word_folders_folder_idx on public.saved_word_folders(user_id, folder_id);
create index if not exists search_history_lookup_idx on public.search_history(user_id, normalized_word, looked_up_at);
create index if not exists flashcards_due_idx on public.flashcards(user_id, due_date, review_state);
create index if not exists deleted_entities_deleted_idx on public.deleted_entities(user_id, deleted_at);
create index if not exists reader_documents_updated_idx on public.reader_documents(user_id, updated_at);

alter table public.user_profiles enable row level security;
alter table public.library_folders enable row level security;
alter table public.saved_words enable row level security;
alter table public.saved_word_folders enable row level security;
alter table public.search_history enable row level security;
alter table public.flashcards enable row level security;
alter table public.deleted_entities enable row level security;
alter table public.reader_documents enable row level security;
alter table public.reader_settings enable row level security;

create policy user_profiles_select_own on public.user_profiles for select to authenticated using (auth.uid() = user_id);
create policy user_profiles_insert_own on public.user_profiles for insert to authenticated with check (auth.uid() = user_id);
create policy user_profiles_update_own on public.user_profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy user_profiles_delete_own on public.user_profiles for delete to authenticated using (auth.uid() = user_id);

create policy library_folders_select_own on public.library_folders for select to authenticated using (auth.uid() = user_id);
create policy library_folders_insert_own on public.library_folders for insert to authenticated with check (auth.uid() = user_id);
create policy library_folders_update_own on public.library_folders for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy library_folders_delete_own on public.library_folders for delete to authenticated using (auth.uid() = user_id);

create policy saved_words_select_own on public.saved_words for select to authenticated using (auth.uid() = user_id);
create policy saved_words_insert_own on public.saved_words for insert to authenticated with check (auth.uid() = user_id);
create policy saved_words_update_own on public.saved_words for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy saved_words_delete_own on public.saved_words for delete to authenticated using (auth.uid() = user_id);

create policy saved_word_folders_select_own on public.saved_word_folders for select to authenticated using (auth.uid() = user_id);
create policy saved_word_folders_insert_own on public.saved_word_folders for insert to authenticated with check (auth.uid() = user_id);
create policy saved_word_folders_update_own on public.saved_word_folders for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy saved_word_folders_delete_own on public.saved_word_folders for delete to authenticated using (auth.uid() = user_id);

create policy search_history_select_own on public.search_history for select to authenticated using (auth.uid() = user_id);
create policy search_history_insert_own on public.search_history for insert to authenticated with check (auth.uid() = user_id);
create policy search_history_update_own on public.search_history for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy search_history_delete_own on public.search_history for delete to authenticated using (auth.uid() = user_id);

create policy flashcards_select_own on public.flashcards for select to authenticated using (auth.uid() = user_id);
create policy flashcards_insert_own on public.flashcards for insert to authenticated with check (auth.uid() = user_id);
create policy flashcards_update_own on public.flashcards for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy flashcards_delete_own on public.flashcards for delete to authenticated using (auth.uid() = user_id);

create policy deleted_entities_select_own on public.deleted_entities for select to authenticated using (auth.uid() = user_id);
create policy deleted_entities_insert_own on public.deleted_entities for insert to authenticated with check (auth.uid() = user_id);
create policy deleted_entities_update_own on public.deleted_entities for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy deleted_entities_delete_own on public.deleted_entities for delete to authenticated using (auth.uid() = user_id);

create policy reader_documents_select_own on public.reader_documents for select to authenticated using (auth.uid() = user_id);
create policy reader_documents_insert_own on public.reader_documents for insert to authenticated with check (auth.uid() = user_id);
create policy reader_documents_update_own on public.reader_documents for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy reader_documents_delete_own on public.reader_documents for delete to authenticated using (auth.uid() = user_id);

create policy reader_settings_select_own on public.reader_settings for select to authenticated using (auth.uid() = user_id);
create policy reader_settings_insert_own on public.reader_settings for insert to authenticated with check (auth.uid() = user_id);
create policy reader_settings_update_own on public.reader_settings for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy reader_settings_delete_own on public.reader_settings for delete to authenticated using (auth.uid() = user_id);
