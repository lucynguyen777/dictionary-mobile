# Uzbek Monolingual Baseline Plan

## Language
- Code: `uz`
- Name: Uzbek
- Family: Turkic, Karluk branch
- Script: Latin in Uzbekistan, with Cyrillic still common and Arabic-script Uzbek used by some communities outside Uzbekistan.
- Writing direction: LTR for Latin and Cyrillic; Arabic-script Uzbek would be RTL but is out of scope for the first app baseline.
- Baseline target: `uz -> uz` monolingual lookup before any bilingual Uzbek pair.

## Scope
Tiny curated Uzbek monolingual baseline is **DONE** (implemented May 22, 2026). This document now serves as the reference plan for the first Uzbek source gate and the path to a larger production-scale integration (Izoh.uz, offline packs, bilingual lookup).

## Current Code Audit
- Status refreshed: June 12, 2026.
- Implementation status: **DONE** — `uz` is registered in `data/languages.ts` (turkic family, LTR, monolingual-only), `data/languageNormalization.ts` (`uz-UZ` locale), `data/adapterRegistry.ts`, and `data/dictionaryApi.ts` dispatch (`fetchUzbekMeaning` / `fetchUzbekRelatedWords`).
- Fixtures: `uzbekDictionaryEntries` live in `data/localLexicon.ts` for `uy`, `kitob`, `qilmoq`, and `oʻzbek` with CC BY-SA 4.0 attribution from Uzbek Wiktionary.
- Normalization: `normalizeUzbekWord` handles common apostrophe variants; `transliterateUzbekCyrillicToLatin` enables Cyrillic-input fallback lookup.
- Morphology: `getUzbekMorphologyCandidates` connects Cyrillic transliteration to noun case/plural and verb conjugation suffix analysis before resolving `-moq` base forms.
- Tests: 7 tests in `tests/dictionaryApi.test.ts`; adapter registry assertion in `tests/adapterRegistry.test.ts`; all 214 tests pass.
- Production source audit: `docs/uzbek-production-source-audit.md` accepts native `uz.wiktionary.org` as a bounded extraction/measurement candidate while keeping Izoh.uz terms-gated and English-definition Kaikki helper-only.
- Remaining gate: production promotion needs representative native extraction/measurement, attributed corpus/offline pack, and UI smoke.

## Comparison With Turkish Baseline
- Turkish already gives the app a Turkic/agglutinative baseline, but Uzbek cannot simply reuse Turkish casing or vowel-harmony assumptions.
- Uzbek standard Latin uses apostrophe-like characters in `oʻ` and `gʻ`; lookup must normalize apostrophe variants without damaging display text.
- Uzbek still has a meaningful Cyrillic corpus and user input may arrive as either Latin (`kitob`) or Cyrillic (`китоб`), so source-backed transliteration is part of the search plan.
- Standard Uzbek has weaker or mostly lost vowel harmony compared with Turkish; morphology fallbacks should prioritize source-provided forms before broad suffix guessing.

## Script And Normalization
- Normalize text to NFC.
- Preserve display script and native punctuation.
- Treat apostrophe-like forms for Latin Uzbek cautiously: ASCII `'`, right/left single quotes, modifier-letter apostrophes, and Uzbek orthographic marks may all appear in user input for `oʻ` / `gʻ`.
- First lookup order should be:
  1. exact same-script headword;
  2. source-provided form match;
  3. Latin/Cyrillic transliteration fallback for known Uzbek letters;
  4. conservative suffix fallback only after source forms are exhausted.
- Do not strip Cyrillic to ASCII blindly; map Cyrillic Uzbek letters such as `ў`, `қ`, `ғ`, and `ҳ` deliberately.

## Morphology
- Uzbek is agglutinative and suffix-heavy.
- Nouns need plural, possessive, and case handling: nominative, genitive, dative, accusative, locative, ablative, and similative-like forms when present in the source.
- Verbs need infinitive `-moq`, negation, tense/aspect/mood/person endings, participles, converbs/gerunds, and common derived forms.
- Local fallback should not invent a large stemmer in the first adapter. Prefer source-provided forms from Wiktionary/Wiktextract or an accepted Uzbek morphology tool.
- UzMorphAnalyser/MorphUz-style work is useful for later lemmatization research, but it is not a definition source.

## Pronunciation
- IPA/audio should be source-backed.
- Do not generate IPA locally for production lookup.
- If a source distinguishes dialectal or regional pronunciation, keep that as metadata rather than normalizing it away.

## Data Source Candidates
1. Izoh.uz
   - True Uzbek explanatory dictionary candidate with Uzbek definitions, examples, and a public web surface.
   - Current page states the project contains more than 35,000 words and shows a current database count around 35,900 words.
   - Production use is blocked until API availability, scraping policy, and license/terms are approved.
2. Uzbek Wiktionary edition (`uz.wiktionary.org`)
   - Uzbek-language Wiktionary exists and may contain Uzbek-definition entries.
   - Accepted for tiny curated fixtures through the MediaWiki API under CC BY-SA 4.0.
   - Source smoke confirmed native Uzbek definitions for `uy`, `kitob`, `qilmoq`, and `oʻzbek`.
   - Current Kaikki raw-data page does not expose an `uzwiktionary` raw dump, so a structured raw path is not yet available.
3. Kaikki/Wiktextract English-edition Uzbek entries
   - Machine-readable Uzbek entries are available at `https://kaikki.org/dictionary/Uzbek/index.html`.
   - Smoke downloaded the postprocessed JSONL and found 4,230 entries with forms, IPA on some words, Latin/Cyrillic variants, and English glosses.
   - Useful for forms, pronunciation, etymology, transliteration, and test morphology, but not a valid `uz -> uz` monolingual definition source by itself.
4. Hosted WiktAPI Uzbek edition
   - Current smoke returned empty search results or 404 direct lookups for `uy`, `kitob`, `qilmoq`, `o'zbek`, `Ўзбек`, and `китоб`.
   - Do not rely on hosted WiktAPI for Uzbek baseline lookup unless a later smoke proves the edition/source is populated.
5. National Encyclopedia of Uzbekistan / OʻzME
   - Uzbek encyclopedic source with a reported CC BY 4.0 release.
   - Potential support source for proper nouns or encyclopedia-style entries, but not a general dictionary baseline.
6. UniMorph / Uzbek morphology research
   - Candidate for morphology/form support only.
   - Not a definition source.

## License Risks
- Izoh.uz requires explicit terms/API approval before production or fixture use.
- Uzbek Wiktionary/Kaikki data follows Wiktionary-derived attribution and ShareAlike requirements under the accepted dictionary source licensing decision.
- OʻzME has a promising open-license signal, but encyclopedia text is not a substitute for dictionary definitions.
- Offline/bundled Uzbek data remains subject to `.docs/decisions/offline-dictionary-bundle.md`.

## Implementation Plan
Status: tiny `uzwiktionary` fixture baseline is **DONE** (May 22, 2026). Remaining work is gated on Izoh.uz API/license approval.

1. ✅ Select and approve a true Uzbek-definition source before adding `uz` to app language metadata: DONE for tiny curated `uzwiktionary` fixtures.
2. Smoke source records for at least:
   - noun Latin: `uy`
   - noun Cyrillic: `китоб`
   - verb: `qilmoq`
   - apostrophe letters: `oʻzbek`, `gʻalaba`
   - inflected forms: `uyda`, `kitoblar`, `qildim`
3. Confirm fields: headword, script, part of speech, Uzbek definitions, examples, source forms, source URL, revision id, license, etymology if available, and attribution.
4. Add script normalization tests for Latin apostrophe variants and Cyrillic-to-Latin fallback.
5. Add adapter tests for monolingual lookup, source-provided form fallback, missing-source behavior, and blocked bilingual routing.
6. Keep Uzbek bilingual lookup blocked until a trustworthy lexical bilingual source exists.

## Tests
- `data/languages.ts` metadata test after adding `uz`.
- `data/languageNormalization.ts` tests for Uzbek Latin apostrophe variants and Cyrillic mapping.
- `data/adapterRegistry.ts` dispatch test after adapter registration.
- Dictionary API/adapter parse tests for the accepted Uzbek source.
- Morphology fallback tests for source-provided forms before any local suffix-stripping fallback.

## Blocked Decisions
- Production-scale Uzbek monolingual lookup remains blocked until a larger source/API path such as Izoh.uz is accepted.
- Tiny committed Uzbek fixtures are unblocked only for documented `uzwiktionary` pages with source URL, revision id, and CC BY-SA attribution.
- Offline Uzbek bundle is blocked until source and ShareAlike/attribution handling are approved.

## First Safe Task
Build a bounded native Uzbek Wiktionary extractor and run the balanced 100-headword Latin/Cyrillic measurement; keep Izoh.uz deferred until terms and key/access handling are documented.

## Sources Checked
- Izoh.uz: https://izoh.uz/
- Uzbek Wiktionary entry point: https://www.wiktionary.org/
- Kaikki English-edition Uzbek data: https://kaikki.org/dictionary/Uzbek/index.html
- Kaikki raw data page: https://kaikki.org/dictionary/rawdata.html
- WiktAPI: https://wiktapi.dev/
- UniMorph: https://unimorph.github.io/
- UzMorphAnalyser: https://arxiv.org/abs/2405.14179
- MorphUz / Uzbek morphology analyser: https://www.sciencedirect.com/science/article/pii/S2949719125000718
- AATT Uzbek script overview: https://www.aatturkic.org/uzbek
- Uzbek transliteration table: https://transliteration.eki.ee/pdf/Uzbek.pdf
- National Encyclopedia of Uzbekistan license/context: https://en.wikipedia.org/wiki/National_Encyclopedia_of_Uzbekistan
