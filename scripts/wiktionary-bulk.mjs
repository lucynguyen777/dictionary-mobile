#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fetchAndSave, slugify } from './wiktionary-client.mjs';

const argv = process.argv.slice(2);
let file = 'data/headword-lists/sample-headwords.txt';
let concurrency = 3;
let batchSize = 20;
let delayBetweenBatches = 3000;
let delayMs = 1200;
let resume = false;

for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--file' || a === '-f') file = argv[++i];
  else if (a === '--concurrency' || a === '-c') concurrency = Number(argv[++i]) || concurrency;
  else if (a === '--batch-size') batchSize = Number(argv[++i]) || batchSize;
  else if (a === '--delay-between-batches') delayBetweenBatches = Number(argv[++i]) || delayBetweenBatches;
  else if (a === '--delay-ms') delayMs = Number(argv[++i]) || delayMs;
  else if (a === '--resume') resume = true;
  else if (a === '--help' || a === '-h') {
    console.log('Usage: node scripts/wiktionary-bulk.mjs [--file FILE] [--concurrency N] [--batch-size N] [--delay-between-batches MS] [--delay-ms MS] [--resume]');
    process.exit(0);
  }
}

async function readList(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return raw.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#')).map(line => {
    let parts = line.split('|');
    if (parts.length < 2) parts = line.split(/\s+/);
    const lang = parts[0].trim();
    const title = parts.slice(1).join('|').trim();
    return { lang, title };
  });
}

function makeLogPath() {
  const dir = path.join(process.cwd(), 'data', 'wiktionary-bulk-runs');
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  return { dir, filename: path.join(dir, `run-${ts}.jsonl`) };
}

async function run() {
  const list = await readList(file);
  if (!list.length) {
    console.log('No headwords found in', file);
    return;
  }

  console.log(`Running bulk crawl: ${list.length} items — batchSize=${batchSize}, concurrency=${concurrency}`);
  const batches = [];
  for (let i = 0; i < list.length; i += batchSize) batches.push(list.slice(i, i + batchSize));

  const { dir, filename } = makeLogPath();
  await fs.mkdir(dir, { recursive: true });

  const summary = { total: list.length, batches: batches.length, ok: 0, skipped: 0, errors: 0 };

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];
    console.log(`Processing batch ${bi + 1}/${batches.length} (${batch.length} items)`);

    const tasks = batch.map(({ lang, title }) => async () => {
      const cachePath = path.join(process.cwd(), 'data', 'wiktionary-cache', lang, `${slugify(title)}.json`);
      try {
        if (resume) {
          try {
            await fs.access(cachePath);
            return { lang, title, status: 'skipped', path: cachePath };
          } catch (e) {}
        }
        const saved = await fetchAndSave(lang, title, { delayMs });
        return { lang, title, status: 'ok', path: saved };
      } catch (err) {
        return { lang, title, status: 'error', error: err?.message || String(err) };
      }
    });

    // run with concurrency
    let idx = 0;
    const results = [];
    async function worker() {
      while (true) {
        const i = idx++;
        if (i >= tasks.length) break;
        results[i] = await tasks[i]();
      }
    }
    await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker()));

    // append results to log
    for (const r of results) {
      await fs.appendFile(filename, JSON.stringify(r) + '\n', 'utf8');
      if (r.status === 'ok') summary.ok++;
      else if (r.status === 'skipped') summary.skipped++;
      else summary.errors++;
    }

    console.log(`Batch ${bi + 1} done — ok=${summary.ok} skipped=${summary.skipped} errors=${summary.errors}`);
    if (bi + 1 < batches.length) await new Promise((r) => setTimeout(r, delayBetweenBatches));
  }

  console.log('Bulk run complete:', summary);
  console.log('Run log:', filename);
}

run().catch((err) => {
  console.error('Bulk run failed', err);
  process.exit(1);
});
