# Native-Edition Wiktionary Source Measurements (2026-10-11)

Plan 6.4/6.6. Each language was measured against Kaikki's Wiktextract extraction of **its own** Wiktionary edition (definitions in the language itself, CC BY-SA 4.0/GFDL), streaming the full dump once with `scripts/measure-kaikki-dump.mjs`. Inflected probes are scored the way the app resolves them: the probe itself, a form listed by the source, or the app's own morphology candidates (`scripts/export-morphology-candidates.ts`). Probe lists: `data/headword-lists/<language>-promotion-100.txt`.

Gates (from `data/languageProductionRoadmap.ts`): corpus ≥5,000, headword exact ≥95%, inflected via morphology ≥85%, examples ≥40%, related words ≥30%.

| Language | Edition / dump | Lemmas | Headword exact | Inflected via morphology | Examples | Related words | Source gates |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| French | frwiktionary 2026-10-01 | 495,763 | 100% | 100% | 100% | 71% | Pass |
| Spanish | eswiktionary 2026-10-02 | 136,522 | 100% | — | 56% | 74% | Pass |
| Russian | ruwiktionary 2026-10 | 445,824 | 100% (80/80) | 100% (20/20) | 91% | 86% | Pass |
| Korean | kowiktionary 2026-10 | 34,902 | 100% (76/76) | 100% (20/20) | 100% | 76% | Pass (after morphology fix below) |
| Turkish | trwiktionary 2026-10 (+ enwiktionary relations as helper) | 188,736 | 100% | 100% | 74.5% | 27.6% native; 63% with helper (76% in the merged pack) | Pass with helper relations |
| Japanese | jawiktionary 2026-10 (+ enwiktionary relations as helper) | 112,940 | 97.5% | 100% | 36.7% native (86% with enwiktionary examples) | 7.6% native, 64.6% with helper | Fails examples unless D12 allows helper examples |
| Chinese | zhwiktionary 2026-10 (漢語) | 68,917 | 64.4% | — | 62% | 53% | Fails exact lookup |
| Malay | mswiktionary 2026-10-03 | 10,427 | 73% | — | 20.5% | 34% | Fails (see `docs/malay-100-headword-measurement.md`, D11) |

Notes:

- **Morphology fixes found by this measurement** (`tests/cjkMorphologyForms.test.ts`): Korean contracted stems (갔다→가다, 했다→하다, 봐요→보다, 마셔요→마시다, 갑니다→가다, ㅂ-irregular 추워요→춥다) and Japanese godan/adjective forms (飲んだ→飲む, 話した→話す, 行きます→行く, 大きかった→大きい). The Japanese `-んだ`/`-いだ` rules were previously unreachable (nested under a `-た` check). Korean inflected coverage went 40% → 100%, Japanese 50% → 100%.
- **Russian**: adjective case forms (`хорошего` → `хороший`, `новые` → `новый`) were added to the morphology after the first run (95% → 100%).
- **Turkish**: native related words are 27.6%. The roadmap already allows English-edition data as a helper; English Wiktionary's Turkish entries list Turkish synonyms, so `build-offline-pack.mjs --helper-input … --helper-source enwiktionary` merges only those relations (never definitions) and credits the helper in each enriched entry's attribution and in the manifest (`helperSources`). With it, 63% of probes have related words (76% in the merged probe pack).
- **Japanese**: helper relations from English Wiktionary (Japanese synonyms) fix related words. Examples stay at 36.7% from the Japanese edition; English Wiktionary has Japanese example sentences for 86% of probes, but they come paired with English translations, so using them in Japanese-only entries is owner decision D12.
- **Chinese**: many common simplified headwords (`学校`, `老师`, `时间`) have no usable definition rows in the extraction; a simplified/traditional mapping or another source is needed before promotion.
- **Pack smoke**: probe-scoped Russian (108 entries), Korean (98 entries) and Turkish (121 entries, helper relations) packs from these dumps pass validation → SQLite import → probe lookup (headwords ≥95%, inflected ≥85% through the app's offline lookup) → delete in `tests/offlinePackProbeSmoke.test.ts`, alongside French and Spanish.
- Passing the source gates is not promotion: each language still needs a pack (scope and host, D9) and the pack/UI smoke, as done for French and Spanish (`tests/offlinePackProbeSmoke.test.ts`).

Reproduce one language:

```bash
npx vite-node scripts/export-morphology-candidates.ts -- --lang ko --probes data/headword-lists/korean-promotion-100.txt > tmp/language-measurements/ko-candidates.json
node scripts/measure-kaikki-dump.mjs --lang ko --probes data/headword-lists/korean-promotion-100.txt \
  --candidates tmp/language-measurements/ko-candidates.json \
  --url 'https://kaikki.org/kowiktionary/%ED%95%9C%EA%B5%AD%EC%96%B4/kaikki.org-dictionary-%ED%95%9C%EA%B5%AD%EC%96%B4.jsonl'
```
