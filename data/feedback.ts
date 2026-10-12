// Client-side rules for the Profile feedback form. Limits mirror backend/feedback.ts.
export type FeedbackCategory = 'bug' | 'feature' | 'content' | 'other';

export const FEEDBACK_MIN_MESSAGE_LENGTH = 10;
export const FEEDBACK_MAX_MESSAGE_LENGTH = 4_000;
export const FEEDBACK_MAX_CONTEXT_LENGTH = 1_000;

export const feedbackCategories: { label: string; value: FeedbackCategory }[] = [
  { label: 'Lỗi', value: 'bug' },
  { label: 'Đề xuất', value: 'feature' },
  { label: 'Nội dung từ điển', value: 'content' },
  { label: 'Khác', value: 'other' },
];

export function validateFeedbackMessage(message: string): string | null {
  const length = message.trim().length;
  if (length < FEEDBACK_MIN_MESSAGE_LENGTH) return `Hãy mô tả ít nhất ${FEEDBACK_MIN_MESSAGE_LENGTH} ký tự.`;
  if (length > FEEDBACK_MAX_MESSAGE_LENGTH) return `Phản hồi tối đa ${FEEDBACK_MAX_MESSAGE_LENGTH} ký tự.`;
  return null;
}

// Diagnostic context sent with each submission: app version and platform only, never user content.
export function buildFeedbackContext(appVersion: string, platform: string) {
  return `app ${appVersion} · ${platform}`.slice(0, FEEDBACK_MAX_CONTEXT_LENGTH);
}

export function describeFeedbackError(error: unknown): string {
  const { code, status } = (error ?? {}) as { code?: string; status?: number };
  if (code === 'backend_proxy_unconfigured' || code === 'feedback_storage_unconfigured' || status === 503) {
    return 'Kênh phản hồi chưa được bật trên bản cài đặt này.';
  }
  if (code === 'feedback_rate_limited' || status === 429) {
    return 'Bạn đã gửi 5 phản hồi trong 24 giờ qua. Thử lại sau.';
  }
  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Đăng nhập lại để gửi phản hồi.';
  if (code === 'feedback_message_invalid') {
    return `Phản hồi cần từ ${FEEDBACK_MIN_MESSAGE_LENGTH} đến ${FEEDBACK_MAX_MESSAGE_LENGTH} ký tự.`;
  }
  return 'Không thể gửi phản hồi lúc này. Kiểm tra kết nối và thử lại.';
}
