import type { SupabaseClient } from '@supabase/supabase-js';

const MAX_MESSAGE_LENGTH = 4_000;
const MAX_CONTEXT_LENGTH = 1_000;
const MAX_SUBMISSIONS_PER_DAY = 5;

export type FeedbackCategory = 'bug' | 'feature' | 'content' | 'other';

export type FeedbackSubmission = {
  category: FeedbackCategory;
  context: string;
  message: string;
};

export type FeedbackStore = {
  configured: boolean;
  countRecent: (userId: string, since: string) => Promise<number>;
  submit: (userId: string, submission: FeedbackSubmission) => Promise<{ id: string }>;
};

export function validateFeedbackSubmission(value: unknown): FeedbackSubmission {
  const input = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const category = String(input.category ?? '').trim() as FeedbackCategory;
  const message = String(input.message ?? '').trim();
  const context = String(input.context ?? '').trim();

  if (!['bug', 'feature', 'content', 'other'].includes(category)) {
    throw new Error('feedback_category_invalid');
  }
  if (message.length < 10 || message.length > MAX_MESSAGE_LENGTH) {
    throw new Error('feedback_message_invalid');
  }
  if (context.length > MAX_CONTEXT_LENGTH) {
    throw new Error('feedback_context_too_large');
  }

  return { category, context, message };
}

export function createSupabaseFeedbackStore(client: SupabaseClient): FeedbackStore {
  return {
    configured: true,
    async countRecent(userId, since) {
      const result = await client
        .from('feedback')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', since);
      if (result.error) throw new Error('feedback_count_failed');
      return result.count ?? 0;
    },
    async submit(userId, submission) {
      const result = await client
        .from('feedback')
        .insert({
          category: submission.category,
          context: submission.context,
          message: submission.message,
          status: 'new',
          user_id: userId,
        })
        .select('id')
        .single();
      if (result.error || !result.data?.id) throw new Error('feedback_submit_failed');
      return { id: String(result.data.id) };
    },
  };
}

export async function submitFeedback(
  store: FeedbackStore | undefined,
  userId: string,
  value: unknown,
  now = new Date()
) {
  if (!store?.configured) throw new Error('feedback_storage_unconfigured');
  const submission = validateFeedbackSubmission(value);
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1_000).toISOString();
  const recentCount = await store.countRecent(userId, since);
  if (recentCount >= MAX_SUBMISSIONS_PER_DAY) throw new Error('feedback_rate_limited');
  return store.submit(userId, submission);
}
