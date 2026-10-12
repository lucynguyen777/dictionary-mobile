// Native PDF text extraction (plan 5.4). Hermes cannot run pdf.js, so native builds run it inside a
// hidden WebView (components/reader/PdfTextExtractorHost.tsx). This module holds the page that
// runs there and the request/response protocol, so both are testable in a browser.
const PDFJS_VERSION = '5.7.284';

export const PDFJS_CDN_BASE_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/legacy/build`;

export type PdfExtractionMessage =
  | { id: string; text: string; type: 'done' }
  | { id: string; message: string; type: 'error' }
  | { type: 'ready' };

// The page loads a pinned pdf.js build. Text is collected page by page, the same way as the web
// path (data/readerImport.ts extractPdfReaderText), and posted back as one message.
export function buildPdfExtractionHtml(pdfjsBaseUrl = PDFJS_CDN_BASE_URL) {
  return `<!doctype html>
<html><head><meta charset="utf-8"></head><body>
<script type="module">
const post = (message) => {
  const payload = JSON.stringify(message);
  if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(payload);
  else window.parent.postMessage(payload, '*');
};
let pdfjs = null;
async function load() {
  if (!pdfjs) {
    pdfjs = await import(${JSON.stringify(`${pdfjsBaseUrl}/pdf.min.mjs`)});
    pdfjs.GlobalWorkerOptions.workerSrc = ${JSON.stringify(`${pdfjsBaseUrl}/pdf.worker.min.mjs`)};
  }
  return pdfjs;
}
window.__extractPdfText = async (id, base64) => {
  try {
    const lib = await load();
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    const document = await lib.getDocument({ data: bytes, isEvalSupported: false }).promise;
    const pages = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const lines = content.items.map((item) => (item.str || '').trim()).filter(Boolean);
      if (lines.length) pages.push(lines.join('\\n'));
    }
    post({ id, text: pages.join('\\n\\n').trim(), type: 'done' });
  } catch (error) {
    const offline = !navigator.onLine || /fetch|import|network|load/i.test(String(error && error.message));
    post({ id, message: offline ? 'pdfjs-unavailable' : String((error && error.message) || error), type: 'error' });
  }
};
post({ type: 'ready' });
</script>
</body></html>`;
}

export function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  let index = 0;
  for (; index + 2 < bytes.length; index += 3) {
    const chunk = (bytes[index] << 16) | (bytes[index + 1] << 8) | bytes[index + 2];
    output += alphabet[(chunk >> 18) & 63] + alphabet[(chunk >> 12) & 63] + alphabet[(chunk >> 6) & 63] + alphabet[chunk & 63];
  }
  const rest = bytes.length - index;
  if (rest === 1) {
    const chunk = bytes[index] << 16;
    output += `${alphabet[(chunk >> 18) & 63]}${alphabet[(chunk >> 12) & 63]}==`;
  } else if (rest === 2) {
    const chunk = (bytes[index] << 16) | (bytes[index + 1] << 8);
    output += `${alphabet[(chunk >> 18) & 63]}${alphabet[(chunk >> 12) & 63]}${alphabet[(chunk >> 6) & 63]}=`;
  }
  return output;
}

type Pending = { reject: (error: Error) => void; resolve: (text: string) => void; timer: ReturnType<typeof setTimeout> };

// Connects the readerImport PDF parser to whichever WebView host is mounted.
export function createPdfExtractionBridge({ timeoutMs = 120_000 }: { timeoutMs?: number } = {}) {
  let send: ((script: string) => void) | null = null;
  let ready = false;
  let counter = 0;
  const pending = new Map<string, Pending>();
  const queue: (() => void)[] = [];

  const settle = (id: string, outcome: { error?: Error; text?: string }) => {
    const request = pending.get(id);
    if (!request) return;
    clearTimeout(request.timer);
    pending.delete(id);
    if (outcome.error) request.reject(outcome.error);
    else request.resolve(outcome.text ?? '');
  };

  return {
    attach(inject: (script: string) => void) {
      send = inject;
    },
    detach() {
      send = null;
      ready = false;
      pending.forEach((_, id) => settle(id, { error: new Error('Trình đọc PDF đã đóng trước khi xử lý xong.') }));
    },
    isAttached: () => send !== null,
    handleMessage(raw: string) {
      let message: PdfExtractionMessage;
      try {
        message = JSON.parse(raw) as PdfExtractionMessage;
      } catch {
        return;
      }
      if (message.type === 'ready') {
        ready = true;
        queue.splice(0).forEach((run) => run());
      } else if (message.type === 'done') {
        settle(message.id, { text: message.text });
      } else if (message.type === 'error') {
        settle(message.id, {
          error: new Error(message.message === 'pdfjs-unavailable'
            ? 'Cần kết nối mạng lần đầu để tải bộ đọc PDF. Kết nối mạng rồi thử lại.'
            : 'Không đọc được nội dung PDF này.'),
        });
      }
    },
    extract(buffer: ArrayBuffer): Promise<string> {
      if (!send) return Promise.reject(new Error('Bộ đọc PDF trên thiết bị chưa sẵn sàng.'));
      const id = `pdf-${(counter += 1)}`;
      return new Promise<string>((resolve, reject) => {
        const timer = setTimeout(() => settle(id, { error: new Error('Đọc PDF quá lâu. Thử file nhỏ hơn.') }), timeoutMs);
        pending.set(id, { reject, resolve, timer });
        const run = () => send?.(`window.__extractPdfText(${JSON.stringify(id)}, ${JSON.stringify(arrayBufferToBase64(buffer))}); true;`);
        if (ready) run();
        else queue.push(run);
      });
    },
  };
}

export const nativePdfExtractionBridge = createPdfExtractionBridge();
