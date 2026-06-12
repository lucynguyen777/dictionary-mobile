# Mandarin Production Source Audit

## Decision

Mandarin remains an **implemented local-fixture monolingual preview with a viable large native-definition extraction source**.

- Hosted WiktAPI does not currently expose the repository's expected direct Mandarin word endpoint.
- English-Wiktionary-derived Chinese data can support readings, forms, and variant measurement, but English definitions are ineligible for Mandarin monolingual production definitions.
- Native `zh.wiktionary.org` is a large CC BY-SA 4.0/GFDL dictionary project with more than 2.3 million entries across many languages.
- Chinese Wiktionary pages can contain several language sections. Production extraction must prove that it selects the Chinese-language section, preserves source revision metadata, and does not misclassify Japanese, Korean, or other Han-character sections as Mandarin.

## Safe Work Completed

- Preserved exact NFC lookup first.
- Replaced the bounded script-variant toggle with directional simplified and traditional candidates, so mixed-script input can produce canonical all-simplified and all-traditional candidates instead of another mixed form.
- Added morphology-aware related-word lookup for verified traditional fixture forms.
- Kept the local character map deliberately bounded; a complete simplified/traditional conversion table must come from an approved, revisioned corpus or mapping dataset.

## Next Promotion Module

1. Build a bounded Chinese Wiktionary extractor that keeps only verified Chinese-language sections and preserves page URL, revision id/date, license, headword, pronunciation/readings, definitions, examples, relations, and source-provided variants.
2. Measure a balanced 100-headword sample covering single characters, multi-character words, simplified/traditional pairs, mixed-script input, polysemy, classifiers, and missing entries.
3. Report Chinese-section parser precision, usable native-definition coverage, readings/examples/relations coverage, and variant-map completeness before choosing an offline-pack scope.
4. Run segmentation smoke in Word and Reader for multi-character words, including environments without `Intl.Segmenter`.
5. Keep production promotion blocked until the measured corpus, attribution UI, offline packaging, and UI smoke gates pass.
