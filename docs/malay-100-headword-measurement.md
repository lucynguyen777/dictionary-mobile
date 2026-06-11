# Malay 100-Headword Corpus Measurement

This report tracks the second active production-promotion candidate after French. The bounded sample is committed at `data/headword-lists/malay-promotion-100.txt` and deliberately includes reduplication, safe prefixes/suffixes, circumfixes, and `meN-`/`peN-` allomorph probes.

## Required Decision

Malay remains **monolingual preview** until the live measurement and a revisioned Kaikki/Malay-Wiktionary candidate prove all shared production gates. In particular, source presence for an inflected word is not sufficient proof that the app can resolve that form to a useful root; morphology fallback must be tested separately.

## Frozen Results

Measured on **2026-06-11**. The live WiktAPI sample resolved 77/100 probes, 40% of inflected probes, 29% examples among resolved entries, and 0% related words. A revisioned Kaikki candidate (`2026-06-07`) produced a 5,000-entry candidate pack; that candidate contained 62/100 representative probes, with examples on 27 probes and relations on 31 probes.

Malay remains preview because exact/source coverage, live examples, live related words, and complex morphology are below production thresholds. Conservative `meN-`/`peN-` restoration is now implemented for common roots, but broader corpus-backed validation is still required.

## Commands

```bash
node scripts/measure-language-corpus.mjs --lang ms --input data/headword-lists/malay-promotion-100.txt
node scripts/extract-kaikki-candidate.mjs --lang ms --limit 5000 --source-url https://kaikki.org/dictionary/Malay/kaikki.org-dictionary-Malay.jsonl
node scripts/build-offline-pack.mjs --input tmp/language-candidates/ms-kaikki-5000.jsonl --lang ms --source kaikki-mswiktionary --source-url https://kaikki.org/dictionary/Malay/ --source-revision 2026-06-07 --out tmp/offline-packs/ms-kaikki-candidate
```
