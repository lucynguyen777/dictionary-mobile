# Malay 100-Headword Corpus Measurement

This report tracks the second active production-promotion candidate after French. The bounded sample is committed at `data/headword-lists/malay-promotion-100.txt` and deliberately includes reduplication, safe prefixes/suffixes, circumfixes, and `meN-`/`peN-` allomorph probes.

## Required Decision

Malay remains **monolingual preview** until the live measurement and a revisioned Kaikki/Malay-Wiktionary candidate prove all shared production gates. In particular, source presence for an inflected word is not sufficient proof that the app can resolve that form to a useful root; morphology fallback must be tested separately.

## Frozen Results

Measured on **2026-06-11**. The live WiktAPI sample resolved 77/100 probes, 40% of inflected probes, 29% examples among resolved entries, and 0% related words. A revisioned Kaikki packaging candidate (`2026-06-07`) contained 62/100 representative probes, but it is English-Wiktionary-derived with English definitions and is therefore ineligible for Malay monolingual production.

Malay remains preview because exact/source coverage, live examples, live related words, complex morphology, and an eligible Malay-definition corpus are below production thresholds. Conservative `meN-`/`peN-` restoration is now implemented for common roots, but broader corpus-backed validation is still required.

## Commands

```bash
node scripts/measure-language-corpus.mjs --lang ms --input data/headword-lists/malay-promotion-100.txt
node scripts/extract-kaikki-candidate.mjs --lang ms --definition-lang en --limit 5000 --source-url https://kaikki.org/dictionary/Malay/kaikki.org-dictionary-Malay.jsonl
# Rejected by the monolingual definition-language guard.
```

## Update 2026-10-11: Malay Wiktionary (mswiktionary) extraction

Measured over Kaikki's Wiktextract extraction of **Malay Wiktionary** (`https://kaikki.org/mswiktionary/Bahasa Melayu/kaikki.org-dictionary-BahasaMelayu.jsonl`, published 2026-10-03, CC BY-SA 4.0/GFDL, Malay definitions):

| Metric | Result | Threshold | Decision |
| --- | ---: | ---: | --- |
| Probes found (exact headword) | 73/100 | 95% | Fail |
| Probes found as headword or listed form | 75/100 | — | Informational |
| Examples among probe entries | 20.5% | 40% | Fail |
| Related words among probe entries | 34.2% | 30% | Pass |
| Attributed corpus | 10,427 lemmas | 5,000 | Pass |

Missing common words include `buku`, `bas`, `kapal`, `kawan`, `guru`, `masa`, `lihat`, `buka`, `tutup`, and affixed forms such as `membaca`, `menulis`, `mengambil`. Malay Wiktionary is too thin for production on its own; Malay stays **preview** on the hosted source until a larger Malay-definition corpus is found.

```bash
node scripts/measure-kaikki-dump.mjs --lang ms --probes data/headword-lists/malay-promotion-100.txt \\
  --url 'https://kaikki.org/mswiktionary/Bahasa%20Melayu/kaikki.org-dictionary-BahasaMelayu.jsonl'
```

## Source search 2026-10-11

| Source | Definitions in | Licence | Probe exact | Probes found incl. forms | Examples | Related | Size | Eligible |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| Malay Wiktionary (mswiktionary, Kaikki) | Malay | CC BY-SA/GFDL | 73% | 75% | 20.5% | 34% | 10,427 lemmas | Too thin |
| English Wiktionary Malay entries (Kaikki) | English | CC BY-SA/GFDL | 90% | 93% | 50% | 60% | 15,088 lemmas | Only as bilingual (Malay → English) definitions |
| Kamus Dewan / PRPM (Dewan Bahasa dan Pustaka) | Malay | Proprietary | — | — | — | — | Large | Needs a licence |
| Open Multilingual Wordnet (Malay) | Synonym sets, no Malay glosses | MIT | — | — | — | — | — | Relations only |

Only 7 probes are missing from both Wiktionary sources, and all are affixed forms or phrases (`mengambil`, `menulis`, `ditutup`, `terbuka`, `pencari`, `di sini`, `di sana`) that the app's Malay morphology maps to base words. No open corpus with Malay-language definitions is large enough, so Malay promotion depends on owner decision D11: show English definitions for Malay (with mswiktionary where it has a Malay definition), or license a Malay dictionary.
