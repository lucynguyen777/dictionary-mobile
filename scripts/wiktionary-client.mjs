#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

export const USER_AGENT = 'dictionary-mobile-crawler/1.0 (+https://github.com/lucynguyen777/dictionary-mobile)';

export function slugify(s) { return String(s).replace(/\s+/g, '_'); }

export async function fetchParse(lang, title, { userAgent = USER_AGENT } = {}) {
  const url = `https://${lang}.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text|sections&format=json&formatversion=2&origin=*`;
  const res = await fetch(url, { headers: { 'User-Agent': userAgent } });
  if (!res.ok) {
    throw new Error(`fetchParse failed ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return data;
}

export async function fetchAndSave(lang, title, { delayMs = 1200, userAgent = USER_AGENT } = {}) {
  const data = await fetchParse(lang, title, { userAgent });
  if (data?.error) {
    throw new Error('API error: ' + JSON.stringify(data.error));
  }
  const dir = path.join(process.cwd(), 'data', 'wiktionary-cache', lang);
  await fs.mkdir(dir, { recursive: true });
  const filename = path.join(dir, `${slugify(title)}.json`);
  await fs.writeFile(filename, JSON.stringify(data, null, 2), 'utf8');
  console.log('Saved', filename);
  // politeness pause
  await new Promise((r) => setTimeout(r, delayMs));
  return filename;
}
