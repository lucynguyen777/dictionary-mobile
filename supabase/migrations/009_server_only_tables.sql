-- Restrict server-owned tables so clients cannot forge quota, usage, provider, or feedback rows.
-- The backend proxy writes these tables with the service role, which bypasses RLS.

-- Provider connections: clients may list their own connections; only the backend creates or revokes them.
drop policy if exists user_provider_connections_all_own on public.user_provider_connections;
drop policy if exists user_provider_connections_select_own on public.user_provider_connections;
create policy user_provider_connections_select_own on public.user_provider_connections
  for select to authenticated using (auth.uid() = user_id);
revoke insert, update, delete on table public.user_provider_connections from authenticated;

-- Secret envelopes: ciphertext never leaves the backend.
drop policy if exists user_provider_secret_envelopes_all_own on public.user_provider_secret_envelopes;
revoke select, insert, update, delete on table public.user_provider_secret_envelopes from authenticated;

-- Usage events: read-only audit trail for the owner.
drop policy if exists proxy_usage_events_all_own on public.proxy_usage_events;
drop policy if exists proxy_usage_events_select_own on public.proxy_usage_events;
create policy proxy_usage_events_select_own on public.proxy_usage_events
  for select to authenticated using (auth.uid() = user_id);
revoke insert, update, delete on table public.proxy_usage_events from authenticated;

drop policy if exists translation_agent_usage_events_all_own on public.translation_agent_usage_events;
drop policy if exists translation_agent_usage_events_select_own on public.translation_agent_usage_events;
create policy translation_agent_usage_events_select_own on public.translation_agent_usage_events
  for select to authenticated using (auth.uid() = user_id);
revoke insert, update, delete on table public.translation_agent_usage_events from authenticated;

-- Feedback: submissions go through /proxy/feedback so the daily rate limit cannot be bypassed.
drop policy if exists feedback_insert_own on public.feedback;
revoke insert, update, delete on table public.feedback from authenticated;

-- Deleting a provider connection must only clear the agent's connection_id, not its NOT NULL user_id.
alter table public.translation_context_agents
  drop constraint if exists translation_context_agents_user_id_connection_id_fkey;
alter table public.translation_context_agents
  add constraint translation_context_agents_user_id_connection_id_fkey
  foreign key (user_id, connection_id)
  references public.user_provider_connections(user_id, id)
  on delete set null (connection_id);
