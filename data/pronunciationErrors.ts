// Vietnamese messages for pronunciation scoring failures (plan 4.6).
export function describePronunciationError(error: unknown) {
  const { code, status } = (error ?? {}) as { code?: string; status?: number };
  if (code === 'pronunciation_unconfigured' || code === 'backend_proxy_unconfigured') {
    return 'Chấm điểm phát âm chưa được bật trên bản cài đặt này.';
  }
  if (status === 401) return 'Đăng nhập để chấm điểm phát âm.';
  if (code === 'quota_exceeded') return 'Bạn đã dùng hết lượt chấm điểm hôm nay. Thử lại vào ngày mai.';
  if (code === 'language_unsupported') return 'Chưa hỗ trợ chấm điểm phát âm cho ngôn ngữ này.';
  if (code === 'pronunciation_no_speech') return 'Không nghe rõ giọng nói trong bản ghi. Hãy ghi âm lại gần micro hơn.';
  if (code === 'audio_too_large' || status === 413) return 'Bản ghi quá dài. Hãy ghi âm ngắn hơn 30 giây.';
  if (code === 'reference_text_invalid') return 'Từ hoặc cụm từ này quá dài để chấm điểm.';
  return 'Chưa chấm điểm được lúc này. Kiểm tra mạng rồi thử lại.';
}
