import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  createSupabaseFeedbackStore,
  submitFeedback,
  validateFeedbackSubmission,
  type FeedbackStore,
} from '../backend/feedback';

function createStore(recentCount = 0): FeedbackStore {
  return {
    configured: true,
    countRecent: vi.fn(async () => recentCount),
    submit: vi.fn(async () => ({ id: 'feedback-id' })),
  };
}

describe('feedback table-only MVP', () => {
  it('validates bounded user feedback without accepting arbitrary categories', () => {
    expect(validateFeedbackSubmission({
      category: 'bug',
      context: '/reader',
      message: 'Reader highlight panel is misplaced.',
    })).toEqual({
      category: 'bug',
      context: '/reader',
      message: 'Reader highlight panel is misplaced.',
    });
    expect(() => validateFeedbackSubmission({ category: 'admin', message: 'Long enough message' }))
      .toThrow('feedback_category_invalid');
    expect(() => validateFeedbackSubmission({ category: 'bug', message: 'short' }))
      .toThrow('feedback_message_invalid');
  });

  it('enforces an authenticated-user daily submission limit before writing', async () => {
    const allowedStore = createStore(4);
    await expect(submitFeedback(allowedStore, 'user-a', {
      category: 'feature',
      message: 'Please add another useful study filter.',
    })).resolves.toEqual({ id: 'feedback-id' });

    const limitedStore = createStore(5);
    await expect(submitFeedback(limitedStore, 'user-a', {
      category: 'feature',
      message: 'Please add another useful study filter.',
    })).rejects.toThrow('feedback_rate_limited');
    expect(limitedStore.submit).not.toHaveBeenCalled();
  });

  it('maps Supabase writes to authenticated user ownership', async () => {
    const single = vi.fn(async () => ({ data: { id: 'saved-id' }, error: null }));
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    const client = { from: vi.fn(() => ({ insert })) } as any;
    const store = createSupabaseFeedbackStore(client);

    await expect(store.submit('user-a', {
      category: 'content',
      context: '/word',
      message: 'This definition needs a clearer source note.',
    })).resolves.toEqual({ id: 'saved-id' });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'user-a', status: 'new' }));
  });

  it('requires RLS, owner checks, bounded columns, and no anon grants', () => {
    const migration = readFileSync(resolve(process.cwd(), 'supabase/migrations/008_feedback_table.sql'), 'utf8').toLowerCase();

    expect(migration).toContain('alter table public.feedback enable row level security');
    expect(migration).toContain('auth.uid() = user_id');
    expect(migration).toContain('with check (auth.uid() = user_id)');
    expect(migration).toContain('char_length(message) between 10 and 4000');
    expect(migration).toContain('grant select, insert on table public.feedback to authenticated');
    expect(migration).not.toMatch(/to\s+anon\b/);
  });
});
