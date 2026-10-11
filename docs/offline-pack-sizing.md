# Offline Pack Sizing (2026-10-11)

Input for owner decision D9 (pack hosting and size). Packs were built from the whole Kaikki/Wiktextract native-edition dumps with `scripts/build-offline-pack.mjs`. Each pack was imported the way the app does it, into a real SQLite file through `tests/offlinePackFullSmoke.test.ts` (opt-in, `OFFLINE_PACK_DIR=…`), then the 100 promotion probes were looked up through the app's offline lookup, including morphology. Nothing here was uploaded anywhere.

"Lemma-only" (`--lemmas-only`) drops Wiktionary's inflected-form entries ("plural of …"), because the app's morphology resolves inflections to the lemma.

| Pack | Entries | Download (gzip) | On device (SQLite + FTS) | Import (Node, laptop-class CPU) | Lookup (avg, with morphology) | Probes found |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| English, lemma-only, 50k by richness (enwiktionary, 860,584 lemmas in the dump) | 50,000 | 32.5 MB | 137 MB | 2 s | 32 ms | 100% (80 headwords, 20 inflected via morphology) |
| Vietnamese, full (viwiktionary) | 40,781 | 3.3 MB | 21 MB | 1 s | 9 ms | 99% |
| Korean, full | 68,290 | 3.7 MB | 29 MB | 2 s | 27 ms | 100% |
| Turkish, full | 300,743 | 10.3 MB | 131 MB | 8 s | 56 ms | 99% |
| Turkish, lemma-only | 188,736 | 8.1 MB | 83 MB | 6 s | 44 ms | 100% (after the Turkish verb rules below) |
| Spanish, full | 833,181 | 26.9 MB | 396 MB | 23 s | 151 ms | 100% |
| Spanish, lemma-only | 136,522 | 11.7 MB | 72 MB | 4 s | 37 ms | 100% (after the irregular fix below) |
| Russian, lemma-only | 445,824 | 50.3 MB | 382 MB | 14 s | 156 ms | 97% (100% after the irregular forms below) |
| French, lemma-only | 495,763 | 91.2 MB | 474 MB | 15 s | 153 ms | 100% (87% before the new French morphology) |
| Russian, lemma-only, 50k by richness | 50,000 | 20.7 MB | 122 MB | 2 s | 34 ms | 99% (missing headword `студент`; `пишу` fixed since) |
| French, lemma-only, 50k by richness | 50,000 | 30.0 MB | 138 MB | 2 s | 39 ms | 100% |

Findings:

- Full dumps are too big for phones in every large edition: hundreds of MB on device and lookups above 100 ms. Lemma-only cuts Spanish by 82% with no loss of probe coverage, so packs should always be built lemma-only.
- Lemma-only still leaves Russian (and French) far above the suggested D9 budget. A cap is needed. `--limit N --rank-by richness` keeps the N best-documented entries (senses, examples, related words, pronunciation, etymology) as a stand-in for a licensed frequency list.
- A 50k cap brings lookups back to Korean-like speed (34–39 ms) and the download to 21–30 MB. The richest entries are also the largest, though, so 50k Russian/French entries still take 120–140 MB on the device. Richness is a usable proxy: it kept 99–100% of the common-word probes. It is not a frequency list, as `студент` (student) fell outside the top 50k. For D9 that suggests a lemma-only, richness-ranked pack of about 50k entries (about 20–30 MB to download). It also suggests capping definitions or examples per entry further if on-device size matters more than depth.
- Phones decode and import more slowly than this machine. On-device timing belongs in the dev-client smoke (`docs/dev-client-smoke-matrix.md`).
- Gaps the full-size smoke found and fixed in the app's morphology (`tests/cjkMorphologyForms.test.ts`):
  - Turkish present continuous and past-with-person verbs (gidiyor → gitmek, yaptım → yapmak);
  - Spanish short irregulars that a length guard dropped (va → ir);
  - Russian irregular and suppletive forms (детей → ребёнок, хочет → хотеть, живёт → жить);
  - French had no morphology at all: the full pack relied on Wiktionary's inflected-form entries, so a lemma-only pack missed 13 of 20 inflected probes. Plurals, feminine forms, -er/-ir/-re verb endings, elided articles and the commonest irregular verbs now resolve.

Reproduce one row:

```bash
node scripts/build-offline-pack.mjs --input es.jsonl --lang es --lemmas-only --source eswiktionary \
  --source-url https://es.wiktionary.org --source-revision 2026-10 --out tmp/es-lemmas
OFFLINE_PACK_DIR=tmp/es-lemmas OFFLINE_PACK_LANG=es OFFLINE_PACK_PROBES=data/headword-lists/spanish-promotion-100.txt \
  npm test -- --run tests/offlinePackFullSmoke.test.ts
```
