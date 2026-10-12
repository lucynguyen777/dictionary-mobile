# Basque Source Gate (2026-10-11)

Plan 6.6. Accepted source-gate path: Basque Wiktionary / Kaikki extraction (`docs/language-source-gates.md`). Kaikki has no extraction of the Basque edition, so it was probed through the MediaWiki API with `scripts/measure-wiktionary-api.mjs` (pages fetched in small batches, Basque `{{-eu-}}` section only, nothing stored). Probe list: `data/headword-lists/basque-promotion-100.txt` (100 common words, headwords only).

| Source | Headword pages | With definitions | Examples (found) | Related words (found) | Definition language | Gates |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| eu.wiktionary.org (9,579 Basque entries) | 57% | 43% | 70.2% | 57.9% | Basque | Fails headword exact (≥95%) |
| English Wiktionary, Basque section (Kaikki, 2026-10-03) | 100% | 100% | 21% | 31% | English | Fails examples (≥40%); English definitions only |

Findings:

- The Basque edition is well structured where it exists (definitions, "Adibidea" examples, Sinonimoak/Antonimoak), but core vocabulary is missing: no page for `joan`, `egin`, `etorri`, `jakin`, `lur`, `esku`, `hitz`, `gorri`, `zuri`, … (41 probes). `bide` and `on` exist without a Basque section, and 14 found pages have headings but no definitions yet (`ogi`, `esne`, `bihotz`, …).
- English Wiktionary covers every probe but with 5,059 lemmas, English definitions and few examples. It could only serve a Basque→English pair, and still fails examples.
- Basque inflects heavily (cases on nouns, auxiliary-based verbs). Neither source was tested for inflected lookup; the app has no Basque morphology yet.

Verdict: no open source passes. Basque stays source-gated. The remaining paths in `docs/language-source-gates.md` need licensing: the deferred national resources (Euskaltzaindia's dictionary, Elhuyar) if their terms allow app use, or a commercial lexicon. That choice is owner decision D14 in `docs/completion-plan.md`.

Reproduce:

```bash
node scripts/measure-wiktionary-api.mjs --site eu.wiktionary.org --probes data/headword-lists/basque-promotion-100.txt \
  --section '\{\{-eu-\}\}' --next-section '\{\{-[a-z-]+-\}\}' --relations 'Sinonimoak|Antonimoak'
node scripts/measure-kaikki-dump.mjs --lang eu --probes data/headword-lists/basque-promotion-100.txt \
  --url 'https://kaikki.org/dictionary/Basque/kaikki.org-dictionary-Basque.jsonl'
```
