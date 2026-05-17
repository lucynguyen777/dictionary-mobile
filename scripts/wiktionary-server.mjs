#!/usr/bin/env node
import * as cheerio from 'cheerio';
import cors from 'cors';
import express from 'express';
import fs from 'fs/promises';
import path from 'path';

const app = express();
app.use(cors());

function slugify(s) { return String(s).replace(/\s+/g, '_'); }

async function fetchParse(lang, title) {
  const url = `https://${lang}.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text|sections&format=json&formatversion=2&origin=*`;
  const USER_AGENT = 'dictionary-mobile-api/1.0 (+https://github.com/lucynguyen777/dictionary-mobile)';
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) {
    console.error('fetchParse failed', res.status, res.statusText);
    return null;
  }
  const data = await res.json();
  return data;
}

function extractSectionHtml(html, anchor) {
  if (!html) return null;
  const $ = cheerio.load(html);
  const span = $('span.mw-headline').filter((i, el) => $(el).attr('id') === anchor).first();
  if (!span || span.length === 0) return null;
  let header = span.parent();
  let el = header.next();
  const parts = [];
  while (el.length && !el.is('h2,h3,h4,h5')) {
    parts.push($.html(el));
    el = el.next();
  }
  return parts.join('');
}

app.get('/api/wiktionary/:lang/:title', async (req, res) => {
  const { lang, title } = req.params;
  const { section } = req.query;
  const cachePath = path.join(process.cwd(), 'data', 'wiktionary-cache', lang, `${slugify(title)}.json`);
  let data = null;
  try {
    const raw = await fs.readFile(cachePath, 'utf8');
    data = JSON.parse(raw);
  } catch (e) {
    data = await fetchParse(lang, title);
    if (data && data.parse) {
      await fs.mkdir(path.dirname(cachePath), { recursive: true });
      await fs.writeFile(cachePath, JSON.stringify(data, null, 2), 'utf8');
    }
  }
  if (!data || !data.parse) return res.status(404).json({ error: 'not found' });
  if (section) {
    const html = extractSectionHtml(data.parse.text, String(section));
    if (!html) return res.status(404).json({ error: 'section not found' });
    return res.json({ lang, title, section, html });
  }
  res.json(data);
});

app.get('/api/wiktionary/:lang/:title/sections', async (req, res) => {
  const { lang, title } = req.params;
  const cachePath = path.join(process.cwd(), 'data', 'wiktionary-cache', lang, `${slugify(title)}.json`);
  let data = null;
  try {
    const raw = await fs.readFile(cachePath, 'utf8');
    data = JSON.parse(raw);
  } catch (e) {
    data = await fetchParse(lang, title);
  }
  if (!data || !data.parse) return res.status(404).json({ error: 'not found' });
  res.json({ sections: data.parse.sections });
});

const port = process.env.PORT || 3007;
app.listen(port, () => console.log(`Wiktionary API server listening on http://localhost:${port}`));
