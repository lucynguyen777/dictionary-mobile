import { describe, expect, it } from 'vitest';

import {
  FEEDBACK_MAX_MESSAGE_LENGTH,
  buildFeedbackContext,
  describeFeedbackError,
  validateFeedbackMessage,
} from '../data/feedback';

describe('validateFeedbackMessage', () => {
  it('requires at least 10 non-space characters', () => {
    expect(validateFeedbackMessage('   ngắn    ')).toMatch(/ít nhất 10/);
    expect(validateFeedbackMessage('Đủ mười ký tự')).toBeNull();
  });

  it('rejects messages over the backend limit', () => {
    expect(validateFeedbackMessage('a'.repeat(FEEDBACK_MAX_MESSAGE_LENGTH))).toBeNull();
    expect(validateFeedbackMessage('a'.repeat(FEEDBACK_MAX_MESSAGE_LENGTH + 1))).toMatch(/tối đa/);
  });
});

describe('buildFeedbackContext', () => {
  it('only carries app version and platform', () => {
    expect(buildFeedbackContext('1.7.0', 'web')).toBe('app 1.7.0 · web');
  });
});

describe('describeFeedbackError', () => {
  it.each([
    [{ code: 'backend_proxy_unconfigured', status: 503 }, /chưa được bật/],
    [{ code: 'feedback_storage_unconfigured', status: 503 }, /chưa được bật/],
    [{ code: 'feedback_rate_limited', status: 429 }, /5 phản hồi/],
    [{ status: 401 }, /Đăng nhập lại/],
    [{ code: 'feedback_message_invalid', status: 400 }, /từ 10 đến 4000/],
    [new TypeError('Failed to fetch'), /kết nối/],
    [undefined, /kết nối/],
  ])('maps %o to a Vietnamese message', (error, expected) => {
    expect(describeFeedbackError(error)).toMatch(expected);
  });
});
