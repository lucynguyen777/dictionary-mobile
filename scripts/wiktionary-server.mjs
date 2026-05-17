#!/usr/bin/env node
import * as cheerio from 'cheerio';
import cors from 'cors';
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fetchParse, slugify } from './wiktionary-client.mjs';

const app = express();
app.use(cors());

// use shared fetchParse/slugify from wiktionary-client.mjs

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
