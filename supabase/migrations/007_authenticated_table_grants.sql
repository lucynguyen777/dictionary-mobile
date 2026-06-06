-- Allow authenticated users to reach RLS policies on app-owned tables.
-- RLS remains the authorization boundary; anon receives no table privileges.

grant select, insert, update, delete on table
  public.user_profiles,
  public.library_folders,
  public.saved_words,
  public.saved_word_folders,
  public.search_history,
  public.flashcards,
  public.deleted_entities,
  public.reader_documents,
  public.reader_settings,
  public.user_provider_connections,
  public.user_provider_secret_envelopes,
  public.proxy_usage_events,
  public.user_glossaries,
  public.user_glossary_entries,
  public.translation_datasets,
  public.translation_dataset_entries,
  public.translation_dataset_documents,
  public.translation_context_agents,
  public.translation_agent_usage_events
to authenticated;
