// Turns dictionary lookup failures into Vietnamese messages for the Word screen. Sources throw
// English diagnostics ("No fr Wiktionary meanings found for …"), which are kept for debugging but
// should not reach learners verbatim.
export function describeLookupError(error: unknown, word: string, languageLabel: string): string {
  const message = error instanceof Error ? error.message : '';
  const name = error instanceof Error ? error.name : '';
  const code = (error as { code?: string } | null)?.code;

  if (code === 'fetch_timeout' || name === 'FetchTimeoutError') {
    return 'Từ điển phản hồi quá lâu. Kiểm tra kết nối rồi thử lại.';
  }
  if (name === 'TypeError' && /fetch|network|load failed/i.test(message)) {
    return 'Không kết nối được tới từ điển. Kiểm tra mạng, hoặc tải gói offline cho ngôn ngữ này.';
  }
  if (/no .*source selected|no local dictionary pack|no monolingual dictionary|no bilingual (adapter|dictionary source)/i.test(message)) {
    return `Chưa có nguồn từ điển cho ${languageLabel}.`;
  }
  if (/no .*(entry|meanings?) found/i.test(message)) {
    return `Chưa tìm thấy "${word.trim()}" trong từ điển ${languageLabel}.`;
  }
  return 'Chưa thể tải dữ liệu từ điển. Thử lại sau.';
}
