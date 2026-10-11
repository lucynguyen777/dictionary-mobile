import { describe, expect, it, vi } from 'vitest';

import { arrayBufferToBase64, buildPdfExtractionHtml, createPdfExtractionBridge } from '../data/pdfWebViewExtraction';

describe('PDF WebView extraction bridge', () => {
  it('queues requests until the page is ready, then resolves with the extracted text', async () => {
    const bridge = createPdfExtractionBridge();
    const scripts: string[] = [];
    bridge.attach((script) => scripts.push(script));

    const result = bridge.extract(new Uint8Array([37, 80, 68, 70]).buffer);
    expect(scripts).toEqual([]);
    bridge.handleMessage(JSON.stringify({ type: 'ready' }));
    expect(scripts[0]).toBe('window.__extractPdfText("pdf-1", "JVBERg=="); true;');

    bridge.handleMessage(JSON.stringify({ id: 'pdf-1', text: 'Hello PDF', type: 'done' }));
    await expect(result).resolves.toBe('Hello PDF');
  });

  it('explains a missing network for the first pdf.js download', async () => {
    const bridge = createPdfExtractionBridge();
    bridge.attach(() => undefined);
    bridge.handleMessage('{"type":"ready"}');
    const result = bridge.extract(new ArrayBuffer(1));
    bridge.handleMessage(JSON.stringify({ id: 'pdf-1', message: 'pdfjs-unavailable', type: 'error' }));
    await expect(result).rejects.toThrow('Cần kết nối mạng');
  });

  it('fails fast without a host, times out, and rejects pending work on detach', async () => {
    await expect(createPdfExtractionBridge().extract(new ArrayBuffer(1))).rejects.toThrow('chưa sẵn sàng');

    vi.useFakeTimers();
    try {
      const slow = createPdfExtractionBridge({ timeoutMs: 1_000 });
      slow.attach(() => undefined);
      const timedOut = slow.extract(new ArrayBuffer(1));
      vi.advanceTimersByTime(1_000);
      await expect(timedOut).rejects.toThrow('quá lâu');
    } finally {
      vi.useRealTimers();
    }

    const closing = createPdfExtractionBridge();
    closing.attach(() => undefined);
    const pending = closing.extract(new ArrayBuffer(1));
    closing.detach();
    await expect(pending).rejects.toThrow('đã đóng');
    expect(closing.isAttached()).toBe(false);
  });

  it('ignores unrelated or malformed messages', async () => {
    const bridge = createPdfExtractionBridge();
    bridge.attach(() => undefined);
    bridge.handleMessage('{"type":"ready"}');
    const result = bridge.extract(new ArrayBuffer(1));
    bridge.handleMessage('not json');
    bridge.handleMessage(JSON.stringify({ id: 'other', text: 'x', type: 'done' }));
    bridge.handleMessage(JSON.stringify({ id: 'pdf-1', text: 'mine', type: 'done' }));
    await expect(result).resolves.toBe('mine');
  });

  it('encodes base64 like Node for every padding length', () => {
    for (const length of [0, 1, 2, 3, 4, 5, 255]) {
      const bytes = Uint8Array.from({ length }, (_, index) => (index * 37) % 256);
      expect(arrayBufferToBase64(bytes.buffer)).toBe(Buffer.from(bytes).toString('base64'));
    }
  });

  it('pins the pdf.js build the page loads', () => {
    expect(buildPdfExtractionHtml()).toContain('https://cdn.jsdelivr.net/npm/pdfjs-dist@5.7.284/legacy/build/pdf.min.mjs');
  });
});

describe('pinned pdf.js version', () => {
  it('matches the installed pdfjs-dist so web, native and tests run the same build', async () => {
    const { readFileSync } = await import('node:fs');
    const installed = JSON.parse(readFileSync('node_modules/pdfjs-dist/package.json', 'utf8')).version;
    const { PDFJS_CDN_BASE_URL } = await import('../data/pdfWebViewExtraction');
    expect(PDFJS_CDN_BASE_URL).toContain(`pdfjs-dist@${installed}/`);
    expect(readFileSync('data/readerImport.ts', 'utf8')).toContain(`const PDFJS_DIST_VERSION = '${installed}'`);
  });
});
