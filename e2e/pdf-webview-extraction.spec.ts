import { readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';

import { buildPdfExtractionHtml } from '../data/pdfWebViewExtraction';

type Message = { id?: string; text?: string; type: string };
type TestWindow = Window & { __extractPdfText: (id: string, base64: string) => void; __messages: Message[] };

// Runs the exact page native builds load in their hidden WebView (data/pdfWebViewExtraction.ts)
// in Chromium, with pdf.js served from node_modules instead of the CDN.
test('the WebView page extracts text from digital PDFs and reports empty scans', async ({ page }) => {
  await page.route('https://pdfjs.test/**', (route) => {
    const file = new URL(route.request().url()).pathname.split('/').pop();
    return route.fulfill({
      body: readFileSync(`node_modules/pdfjs-dist/legacy/build/${file}`),
      contentType: 'text/javascript',
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  });
  await page.route('https://app.test/', (route) =>
    route.fulfill({ body: buildPdfExtractionHtml('https://pdfjs.test/build'), contentType: 'text/html' })
  );
  await page.addInitScript(() => {
    const win = window as unknown as TestWindow;
    win.__messages = [];
    window.addEventListener('message', (event) => win.__messages.push(JSON.parse(event.data)));
  });
  await page.goto('https://app.test/');
  await page.waitForFunction(() => (window as unknown as TestWindow).__messages.some((message) => message.type === 'ready'));

  const extract = async (id: string, fixture: string) => {
    const base64 = readFileSync(`tests/fixtures/reader-pdf/${fixture}`).toString('base64');
    await page.evaluate(([requestId, data]) => (window as unknown as TestWindow).__extractPdfText(requestId, data), [id, base64]);
    await page.waitForFunction(
      (requestId) => (window as unknown as TestWindow).__messages.some((message) => message.id === requestId),
      id,
      { timeout: 30_000 }
    );
    return page.evaluate((requestId) => (window as unknown as TestWindow).__messages.find((message) => message.id === requestId)!, id);
  };

  const simple = await extract('a', 'digital-simple.pdf');
  expect(simple.type).toBe('done');
  expect(simple.text).toContain('Reader PDF Simple Fixture');

  const multiline = await extract('b', 'digital-multiline.pdf');
  expect(multiline.type).toBe('done');
  expect(multiline.text!.split('\n').length).toBeGreaterThan(2);

  const scanned = await extract('c', 'scanned-image.pdf');
  expect(scanned).toEqual({ id: 'c', text: '', type: 'done' });
});
