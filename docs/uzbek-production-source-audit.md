# Uzbek Production Source Audit

## Decision

Uzbek remains an **implemented local-fixture monolingual preview with a viable native-source candidate**.

- Hosted WiktAPI remains unavailable for sampled Uzbek headwords.
- English-Wiktionary-derived Kaikki Uzbek data is useful for forms, pronunciation, transliteration, and morphology measurement, but English definitions are ineligible for Uzbek monolingual production definitions.
- Native `uz.wiktionary.org` exposes substantial native Uzbek definitions and examples through the MediaWiki API. It reports more than 119,000 articles.
- Izoh.uz remains a promising larger explanatory-dictionary candidate, but production use stays blocked until API access and terms/license are approved.
- Native Uzbek Wiktionary is viable for a bounded extraction/measurement module, but production promotion still requires representative corpus measurement and an attributed offline pack.

## Safe Work Completed

- Extended apostrophe normalization to additional modifier-letter variants while preserving canonical Uzbek `ʻ`.
- Connected Cyrillic-to-Latin transliteration to the existing suffix analyzer so inflected Cyrillic queries such as `китобларда` and `қилдим` can reach existing Latin fixture lemmas.
- Preserved same-script exact lookup before transliteration and suffix fallback.
- Kept Izoh.uz and English-definition data out of Uzbek production fixtures and packs.

## Next Promotion Module

1. Build a bounded `uz.wiktionary.org` extractor preserving page URL, revision id/date, license, Uzbek definitions, examples, relations, script variants, and forms.
2. Measure a balanced 100-headword sample across Latin/Cyrillic input, apostrophe variants, noun suffix chains, verbs, and source-provided forms.
3. Confirm at least 5,000 usable native-definition entries after parsing and deduplication, or document the measured shortfall.
4. Build and smoke-test an attributed offline pack through the existing SQLite pipeline.
5. Promote only after shared exact lookup, morphology, examples, related words, offline pack, and UI gates pass.
