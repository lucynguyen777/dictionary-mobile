#!/usr/bin/env node
import fs from 'fs';
import { join } from 'path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function extract(filePath) {
  const data = fs.readFileSync(filePath);
  const uint8 = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  const standardFontDataUrl = join(process.cwd(), 'node_modules', 'pdfjs-dist', 'standard_fonts') + '/';
  const pdf = await pdfjsLib.getDocument({
    data: uint8,
    disableWorker: true,
    isEvalSupported: false,
    standardFontDataUrl,
    useWorkerFetch: false,
  }).promise;
  const pages = [];

  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const lines = content.items.map((item) => (item.str ? String(item.str).trim() : '')).filter(Boolean);
    if (lines.length) pages.push(lines.join('\n'));
  }

  return pages.join('\n\n').trim();
}

(async () => {
  try {
    const filePath = process.argv[2];
    if (!filePath) throw new Error('Missing file path argument');
    const text = await extract(filePath);
    // Output as base64 to avoid encoding issues
    console.log(Buffer.from(text, 'utf8').toString('base64'));
  } catch (err) {
    console.error(err instanceof Error ? err.stack : String(err));
    process.exit(1);
  }
})();
