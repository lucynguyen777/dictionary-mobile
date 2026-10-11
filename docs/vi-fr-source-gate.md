# VI→FR Source Gate (2026-10-11)

Plan 6.6. The accepted source-gate path for a Vietnamese→French dictionary is Wiktionary/DBnary bilingual extraction (`docs/language-source-gates.md`). This document records the probe of that path. Nothing here is machine translation: every definition is a French gloss written by Wiktionary editors for a Vietnamese headword.

## Candidate

**French Wiktionary, Vietnamese section** ("Vietnamien"), extracted by Wiktextract and published by Kaikki:
`https://kaikki.org/frwiktionary/Vietnamien/kaikki.org-dictionary-Vietnamien.jsonl` (16.7 MB, last modified 2026-10-02).

- Each row is a Vietnamese headword (`lang_code: vi`) whose senses are glossed in French, with Vietnamese examples that carry French translations. This is the dictionary-style VI→FR row shape the gate asks for.
- Licence: CC BY-SA 4.0 / GFDL (Wiktionary), with attribution to the French Wiktionary and Kaikki/Wiktextract, the same as the French pack.
- DBnary exposes the same French Wiktionary content as RDF. It would add no coverage, so the Kaikki JSONL (which the pack pipeline already reads) is the practical form.

## Measurement

Probe list: `data/headword-lists/vietnamese-promotion-100.txt` (100 common Vietnamese words). Vietnamese does not inflect, so there is no morphology gate. Measured with `scripts/measure-kaikki-dump.mjs`.

| Metric | Result | Gate | |
| --- | ---: | ---: | --- |
| Vietnamese headwords (frwiktionary) | 16,048 (17,839 entries; 1,431 are single-character Hán/Nôm entries) | ≥5,000 | Pass |
| Headword exact (probes) | 98% (missing: `nóng`, `sáng`) | ≥95% | Pass |
| Examples (found probes) | 67.3% (all lemmas: 38.4%; 98% of examples carry a French translation) | ≥40% | Pass |
| Related words, native (found probes) | 12.2% | ≥30% | Fail alone |
| Related words with enwiktionary helper relations | 65.3% (64 of 98) | ≥30% | Pass with helper |

The helper is English Wiktionary's Vietnamese section (`https://kaikki.org/dictionary/Vietnamese/kaikki.org-dictionary-Vietnamese.jsonl`, 39,329 lemmas, 61% of probes with Vietnamese synonyms/antonyms). As for Turkish, `build-offline-pack.mjs --helper-input … --helper-source enwiktionary` would merge only those Vietnamese relations, never the English definitions, and credit the helper.

## Quality notes

- 8.3% of senses (outside character entries) are glossed in Vietnamese rather than French, mostly cross-references such as "Nói tắt của nha_lại." (short for …). A pack should keep them as cross-references or drop senses without a French gloss; they are not translations to show as French definitions.
- The two missing probes are common adjectives (`nóng` hot, `sáng` bright/morning). They appear only as paronyms of other entries. Missing words fall back to the hosted path like other offline packs.
- Coverage is 16k headwords, about a third of the English edition's Vietnamese section. It is enough for common vocabulary, not for a comprehensive dictionary.

## Verdict

The path passes the corpus, headword and example gates, and the related-words gate with helper relations. It needs the owner's approval as the VI→FR source (completion plan D13) before implementation. Implementation would add a pair pack (`vi` headwords, French definitions) to the offline pack pipeline and the probe-scoped pack smoke, then the UI smoke.

Reproduce:

```bash
node scripts/measure-kaikki-dump.mjs --lang vi --probes data/headword-lists/vietnamese-promotion-100.txt \
  --url 'https://kaikki.org/frwiktionary/Vietnamien/kaikki.org-dictionary-Vietnamien.jsonl'
node scripts/measure-kaikki-dump.mjs --lang vi --probes data/headword-lists/vietnamese-promotion-100.txt \
  --url 'https://kaikki.org/dictionary/Vietnamese/kaikki.org-dictionary-Vietnamese.jsonl'
```
