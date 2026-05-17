#!/usr/bin/env node
import { fetchAndSave } from './wiktionary-client.mjs';

const args = process.argv.slice(2);
if (args.length === 0 || args.length % 2 !== 0) {
  console.error('Usage: node scripts/wiktionary-crawler.mjs <lang> <title> [<lang> <title> ...]');
  process.exit(1);
}

(async function main() {
  for (let i = 0; i < args.length; i += 2) {
    const lang = args[i];
    const title = args[i + 1];
    try {
      await fetchAndSave(lang, title);
    } catch (err) {
      console.error('Error fetching', lang, title, err?.message || err);
    }
  }
})();
