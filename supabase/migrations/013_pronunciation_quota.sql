-- Pronunciation scoring quota (plan 4.6, owner decision D6: 20 scores per user per day).
-- Only counters are stored; raw audio, transcripts and scores never reach the database.

alter table public.proxy_quota_counters
  drop constraint if exists proxy_quota_counters_feature_check;
alter table public.proxy_quota_counters
  add constraint proxy_quota_counters_feature_check
  check (feature in ('translation', 'ai-chat', 'pronunciation'));
