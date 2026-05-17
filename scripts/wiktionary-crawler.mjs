#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const args = process.argv.slice(2);
if (args.length === 0 || args.length % 2 !== 0) {
  console.error('Usage: node scripts/wiktionary-crawler.mjs <lang> <title> [<lang> <title> ...]');
  process.exit(1);
}

const USER_AGENT = 'dictionary-mobile-crawler/1.0 (+https://github.com/lucynguyen777/dictionary-mobile)';

async function fetchAndSave(lang, title) {
  const url = `https://${lang}.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text|sections&format=json&formatversion=2&origin=*`;
  console.log('Fetching', lang, title);
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) {
    console.error('Fetch failed', res.status, res.statusText);
    return;
  }
  const data = await res.json();
  if (data.error) {
    console.error('API error', JSON.stringify(data.error));
    return;
  }

  const dir = path.join(process.cwd(), 'data', 'wiktionary-cache', lang);
  await fs.mkdir(dir, { recursive: true });
  const filename = path.join(dir, `${slugify(title)}.json`);
  await fs.writeFile(filename, JSON.stringify(data, null, 2), 'utf8');
  console.log('Saved', filename);
  // politeness: pause a bit between requests
  await new Promise((r) => setTimeout(r, 1200));
}

function slugify(s) {
  return String(s).replace(/\s+/g, '_');
}

(async function main() {
  for (let i = 0; i < args.length; i += 2) {
    const lang = args[i];
    const title = args[i + 1];
    try {
      await fetchAndSave(lang, title);
    } catch (err) {
      console.error('Error fetching', lang, title, err);
    }
  }
})();
