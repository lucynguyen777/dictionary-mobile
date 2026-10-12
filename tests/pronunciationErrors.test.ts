import { expect, test } from 'vitest';

import { describePronunciationError } from '@/data/pronunciationErrors';

test('pronunciation errors read as Vietnamese guidance', () => {
  expect(describePronunciationError({ code: 'pronunciation_unconfigured', status: 503 })).toContain('chưa được bật');
  expect(describePronunciationError({ status: 401 })).toContain('Đăng nhập');
  expect(describePronunciationError({ code: 'quota_exceeded', status: 429 })).toContain('hết lượt');
  expect(describePronunciationError({ code: 'pronunciation_no_speech', status: 422 })).toContain('ghi âm lại');
  expect(describePronunciationError({ status: 413 })).toContain('30 giây');
  expect(describePronunciationError(new Error('network'))).toContain('thử lại');
});
