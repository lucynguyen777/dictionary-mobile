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
- The two missing probes are common adjectives (`nóng` hot, `sáng` bright/morning). They appear only as paronyms of other entries. VI→FR has no other approved source, so missing words show the not-found message rather than a fallback.
- Coverage is 16k headwords, about a third of the English edition's Vietnamese section. It is enough for common vocabulary, not for a comprehensive dictionary.

## Verdict

The path passes the corpus, headword and example gates, and the related-words gate with helper relations. The owner approved it as the VI→FR source on 2026-10-12 (completion plan D13).

## Implementation (2026-10-12)

- **Builder**: `scripts/build-offline-pack.mjs --lang vi --gloss-lang fr` builds a pair pack. The manifest records `glossLangCode: "fr"`, the pack id is `frwiktionary-vi-fr-offline-pack-v1`, entries carry `glossLangCode`, and example translations are marked `translationLanguage: "fr"`. Monolingual packs are unchanged (no new fields, same ids).
- **Vietnamese-glossed senses are dropped**, not shown as French definitions: glosses that start with a Vietnamese cross-reference ("Xem …", "Như …", "Nói tắt của …", "Cũng nói/viết …") or where at least half the words outside parentheses are Vietnamese (Vietnamese-only diacritics or function words). French glosses that cite a Vietnamese word, such as "Famille (xem gia đình)." or "Abréviation de bến xe", are kept. On the full 2026-10-02 dump this dropped 447 glosses, and 221 headwords that had only Vietnamese glosses are left out (16,002 → 15,781 entries; they get the not-found message). This classifier finds fewer Vietnamese glosses (about 2% outside character entries) than the 8.3% first estimate above, which counted any gloss containing Vietnamese words; a manual review of the remaining glosses with Vietnamese letters found French glosses citing Vietnamese terms.
- **Helper**: `--helper-input <enwiktionary Vietnamese> --helper-source enwiktionary` merges only synonyms/antonyms and credits them in the entry attribution and manifest `helperSources`.
- **Full build**: 15,781 entries, 1.21 MB gzipped (`entries.json.gz`), 2,153 entries enriched with helper relations. Probe coverage of the built pack: 98% headwords (missing `nóng`, `sáng`), examples 67.3%, related words 65.3%.
- **App**: `OfflineDictionaryPack.glossLanguageCode` marks pair packs; `getOfflinePackDictionaryKey` keys them `vi->fr`, so a hosted VI-VI pack and the pair pack never replace each other in the catalog merge, and monolingual Vietnamese lookups never read French definitions. The catalog (`scripts/build-pack-catalog.mjs`, `data/offlinePackCatalog.ts`) carries `glossLanguageCode`. `lookupBilingual` answers `vi->fr` from an installed pair pack only; without one it says the pack is not available and never falls back to MinhQnd, DeepL/OpenAI or machine translation.
- **Status**: the pair pack is listed as `builder_ready` with no download source. Hosting is decision D9 (Supabase Storage) and has not happened, so nothing is installed by default and the Word screen keeps its "coming soon" notice for VI→FR until an installed pack answers.
- **Smoke**: `tests/fixtures/offline-packs/vi-fr-probe-smoke` (98 entries, 32 KB) passes validation → SQLite import → probe lookup (≥95% headwords) → delete in `tests/offlinePackProbeSmoke.test.ts`, and checks that no definition is a Vietnamese cross-reference.
- **Remaining**: upload the pack and catalog (D9), then the native-device pack smoke and the Word/Reader/Library UI smoke.

Build the pair pack:

```bash
node scripts/build-offline-pack.mjs --input kaikki.org-dictionary-Vietnamien.jsonl --lang vi --gloss-lang fr \
  --source frwiktionary --source-url 'https://kaikki.org/frwiktionary/Vietnamien/kaikki.org-dictionary-Vietnamien.jsonl' \
  --source-revision 2026-10-02 --generated-at 2026-10-12T00:00:00.000Z \
  --helper-input kaikki.org-dictionary-Vietnamese.jsonl --helper-source enwiktionary --out tmp/offline-packs/vi-fr-v1
```

Reproduce:

```bash
node scripts/measure-kaikki-dump.mjs --lang vi --probes data/headword-lists/vietnamese-promotion-100.txt \
  --url 'https://kaikki.org/frwiktionary/Vietnamien/kaikki.org-dictionary-Vietnamien.jsonl'
node scripts/measure-kaikki-dump.mjs --lang vi --probes data/headword-lists/vietnamese-promotion-100.txt \
  --url 'https://kaikki.org/dictionary/Vietnamese/kaikki.org-dictionary-Vietnamese.jsonl'
```
