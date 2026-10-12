import { describe, expect, it } from 'vitest';

import { FetchTimeoutError } from '../data/http';
import { describeLookupError } from '../data/lookupErrors';

describe('describeLookupError', () => {
  it.each([
    [new Error('No fr Wiktionary meanings found for "maisonn".'), 'Chưa tìm thấy "maisonn" trong từ điển Tiếng Pháp.'],
    [new Error('No dictionary entry found for "maisonn".'), 'Chưa tìm thấy "maisonn" trong từ điển Tiếng Pháp.'],
    [new Error('No Turkish Wiktionary meanings found for "maisonn".'), 'Chưa tìm thấy "maisonn" trong từ điển Tiếng Pháp.'],
    [new Error('No monolingual dictionary source selected for "xx".'), 'Chưa có nguồn từ điển cho Tiếng Pháp.'],
    [new FetchTimeoutError(10_000), 'Từ điển phản hồi quá lâu. Kiểm tra kết nối rồi thử lại.'],
    [new TypeError('Failed to fetch'), 'Không kết nối được tới từ điển. Kiểm tra mạng, hoặc tải gói offline cho ngôn ngữ này.'],
    [new Error('Unexpected token < in JSON'), 'Chưa thể tải dữ liệu từ điển. Thử lại sau.'],
    [undefined, 'Chưa thể tải dữ liệu từ điển. Thử lại sau.'],
  ])('maps %o', (error, expected) => {
    expect(describeLookupError(error, ' maisonn ', 'Tiếng Pháp')).toBe(expected);
  });
});
