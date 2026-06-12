# Kazakh Monolingual Baseline Plan

## Language
- Code: `kk`
- Name: Kazakh (Қазақ тілі / Qazaq tili)
- Family: Turkic, Kipchak branch (closely related to Kyrgyz; more distantly to Uzbek/Turkish)
- Scripts in use:
  - **Cyrillic** (Kazakhstan official until ~2031; dominant in current digital corpora)
  - **New Kazakh Latin** (official transitional alphabet since 2017, gradually replacing Cyrillic)
  - **Arabic-script Kazakh** (used by Kazakh communities in China/Afghanistan; out of scope for first baseline)
- Writing direction: LTR for Cyrillic and Latin; Arabic-script Kazakh would be RTL but is out of scope.
- Baseline target: `kk → kk` monolingual lookup before any bilingual Kazakh pair.

## Scope
This plan is now unblocked for a small source-backed baseline. `docs/kazakh-source-smoke.md` accepted Kazakh Wiktionary (`kk.wiktionary.org`) via the MediaWiki API for curated fixtures and adapter parsing under CC BY-SA 4.0 attribution rules. Kaikki `kkwiktionary` raw-dump ingestion remains blocked because the raw path currently returns 404.

## Current Code Audit
- Status refreshed: June 12, 2026.
- Implemented in code: `kk` is registered in `data/languages.ts` with `dictionaryStatus: 'monolingual'` and `adapterKey: 'kk'`; `data/adapterRegistry.ts` dispatches to `fetchKazakhMeaning` and `fetchKazakhRelatedWords`.
- Fixture/runtime path: curated Kazakh Wiktionary fixtures, Cyrillic-preserving normalization, noun/adjective/verb morphology fallback, and related-word lookup are wired through `data/localLexicon.ts`, `data/languageNormalization.ts`, `data/morphology.ts`, and `data/dictionaryApi.ts`.
- Production source audit: `docs/kazakh-production-source-audit.md` accepts native `kk.wiktionary.org` for bounded extraction/measurement while recording its current corpus-size and placeholder constraints.
- Remaining gate: representative coverage measurement, bulk source approval, and offline Kazakh bundle packaging remain blocked.

## Comparison With Turkish / Uzbek Baseline
- Turkish gives the app a Turkic/agglutinative baseline. Kazakh belongs to the **Kipchak branch** (not Oghuz like Turkish), so vowel harmony patterns and suffix shapes differ significantly.
- Unlike Uzbek (which has weakened vowel harmony), Kazakh retains **full vowel harmony** — both palatal and labial harmony apply to suffixes. Morphology fallbacks must account for this.
- The app already handles Cyrillic via the Russian baseline, but Kazakh Cyrillic adds **extra letters**: `Ә`, `Ғ`, `Қ`, `Ң`, `Ө`, `Ұ`, `Ү`, `Һ`, `І`. These must not be stripped or confused with Russian Cyrillic.
- Kazakh Latin (2021 edition) uses digraphs: `Sh`, `Ch`, `Gh`, `Ng`, and accented vowels `Á`, `Ó`, `Ú`, `Ý`. User input may arrive in either script.
- Uzbek uses apostrophe-like marks (`oʻ`/`gʻ`); Kazakh Latin uses distinct digraphs instead. Do not reuse Uzbek apostrophe-normalization logic for Kazakh.

## Script And Normalization
- Normalize all text to **NFC** before lookup.
- **Cyrillic Kazakh**: respect the full 42-letter Kazakh Cyrillic alphabet. Common look-alike pairs with Russian (e.g., `Ы` vs `І`, `У` vs `Ұ`/`Ү`) must not be conflated.
- **Latin Kazakh (2021)**: lowercasing must preserve digraph integrity (`SH → sh`, `CH → ch`, `GH → gh`, `NG → ng`).
- **Cross-script lookup**: if user inputs Latin, attempt Cyrillic headword lookup via a verified Kazakh Latin↔Cyrillic transliteration table, and vice versa. This is a source-smoke concern, not a first-adapter responsibility.
- **Lookup order**:
  1. Exact same-script headword (lowercased, NFC).
  2. Source-provided form match.
  3. Latin↔Cyrillic transliteration fallback.
  4. Conservative suffix fallback only after source forms are exhausted.

## Morphology
Kazakh is a **strongly agglutinative**, suffix-heavy language.

### Nouns
- **Case system**: 7 cases — Nominative, Genitive, Dative, Accusative, Locative, Ablative, Instrumental.
- Each case suffix has **vowel-harmony variants** (e.g., Genitive: `-нің/-нiң/-дың/-дiң/-тың/-тiң`).
- **Plural suffix**: `-лар/-лер/-дар/-дер/-тар/-тер` (vowel-harmony and consonant-harmony conditioned).
- Possessive suffixes stack with case suffixes; stripping should peel possessive before case.
- Example: `кітап` (book) → `кітаптың` (genitive), `кітапта` (locative), `кітаптар` (plural).

### Verbs
- Citation form: bare stem (dictionaries use stem alone, not infinitive marker).
- **Negation suffix**: `-ма/-ме/-ба/-бе/-па/-пе`.
- Tense/aspect/mood markers attach after negation, before person agreement.
- Common tenses: aorist (`-ады/-еді`), past (`-ды/-ді/-ты/-ті`), evidential past (`-ған/-ген/-қан/-кен`), future (`-ар/-ер/-р`), present-continuous (`-п жатыр`).
- Person agreement is a separate outer suffix layer.
- Example: `оқу` (to read) → `оқыдым` (I read), `оқымады` (did not read), `оқып жатыр` (is reading).
- Local fallback: strip person agreement, then tense, then negation to recover bare stem. Prefer source-provided forms before local stemming.

### Adjectives
- Comparative: `-рақ/-рек/-ырақ/-ірек`.
- Degree/intensification via particles or reduplication; no stripping needed at first baseline.

## Pronunciation
- IPA transcription should be **source-backed**; do not generate IPA locally.
- Kazakh has uvular and pharyngeal consonants (`Ғ`, `Қ`, `Ң`, `Һ`) distinct from Russian equivalents.
- If source provides audio, surface it. Do not synthesize TTS without a validated Kazakh voice model.

## Data Source Candidates

### 1. Kazakh Wiktionary (`kk.wiktionary.org`)
- Kazakh-language Wiktionary with native Kazakh definitions.
- **Hosted WiktAPI**: `https://api.wiktapi.dev/v1/kk/word/кітап` returned 404-style JSON in the May 22, 2026 smoke; search returned empty arrays for sampled common words.
- **Kaikki/Wiktextract `kkwiktionary` raw dump**: `https://kaikki.org/kkwiktionary/rawdata.html` returned HTTP 404 in the May 22, 2026 smoke.
- **MediaWiki API**: accepted first adapter path. The `кітап`, `үй`, `жақсы`, `келу`, and `айту` pages provide usable Kazakh-definition smoke evidence; several common verb pages such as `оқу` still contain definition placeholders, so fixtures must avoid placeholder-only entries.
- Wiktionary-derived data is usable under the accepted CC BY-SA dictionary source licensing policy (attribution required). API calls must include a descriptive `User-Agent` or `Api-User-Agent`.

### 2. Kaikki English-edition Kazakh entries
- URL: `https://kaikki.org/dictionary/Kazakh/index.html`
- English glosses for Kazakh headwords from English Wiktionary.
- Useful for forms, IPA, transliteration, and morphology testing.
- **Not** a valid `kk → kk` monolingual source by itself.

### 3. Sozdik.kz (Сөздік.kz)
- One of the largest public Kazakh dictionary portals with Kazakh–Russian, Kazakh–English, and monolingual explanatory content.
- API availability, scraping policy, and license/terms unknown — **requires explicit approval** before production or fixture use.

### 4. Qazaq Tilinin Tusindirme Sozdigi (State Explanatory Dictionary)
- Official state explanatory dictionary published by the Kazakh Language Committee.
- May be available in digitized form; licensing unclear.
- **Blocked** until license and distribution terms are verified.

### 5. UniMorph / Kazakh morphology research
- Some UniMorph coverage exists for Kazakh morphological paradigms.
- Useful for morphology/form validation only; not a definition source.

### 6. TilAlemi / KazNLP community resources
- Research-grade Kazakh NLP tools and corpora from Kazakhstani universities.
- Useful for future lemmatizer/morphology; not a ready definition source.

## License Risks
- Sozdik.kz and official state dictionaries require explicit API/terms approval before production or fixture use.
- Kaikki/Wiktionary-derived data follows the accepted CC BY-SA attribution and ShareAlike policy.
- English Wiktionary Kazakh entries cannot substitute for native Kazakh definitions.
- Offline Kazakh bundle remains subject to `docs/decisions/offline-dictionary-bundle.md`.

## Implementation Plan
Status: first small baseline is implemented. Bulk Kaikki raw-dump ingestion remains blocked.

1. **Source approval**: DONE for Kazakh Wiktionary MediaWiki API and curated CC BY-SA fixtures; Kaikki raw dump and Sozdik.kz remain blocked.
2. **Script normalization tests**: DONE for Kazakh Cyrillic extra letters and NFC/lowercase preservation. Latin↔Cyrillic transliteration remains future work.
3. **Metadata configuration**: DONE. `kk` is registered in `data/languages.ts` with `dictionaryStatus: 'monolingual'` and `adapterKey: 'kk'`.
4. **Morphology rules** (`data/morphology.ts`): DONE for first baseline:
   - Strip vowel-harmony-aware case endings (7 cases × harmony variants).
   - Strip plural suffix.
   - Strip verb person agreement, tense, and negation layers to recover bare stem.
5. **Local lexicon fixtures** (`data/localLexicon.ts`): DONE with CC BY-SA-attributed entries:
   - `кітап` (book — noun)
   - `үй` (house — noun)
   - `айту` (to say — verb)
   - `жақсы` (good — adjective)
6. **Adapter integration**: DONE. `fetchKazakhMeaning` and `fetchKazakhRelatedWords` are registered in `data/dictionaryApi.ts` and `data/adapterRegistry.ts`.
7. **Unit tests**: DONE. Exact-match, case-stripped, plural-stripped, verb-stem, related-word, adapter, and normalization coverage live in `tests/dictionaryApi.test.ts`, `tests/adapterRegistry.test.ts`, and `tests/languageNormalization.test.ts`.

## Tests Needed
- Expand Latin↔Cyrillic transliteration tests only after a verified mapping table is accepted.
- Add more verb fixtures only after sampled Kazakh Wiktionary pages provide non-placeholder definitions.
- Add offline bundle/import tests only after a bulk source path is approved.

## Blocked Decisions
- **Bulk source approval** remains blocked for Kaikki `kkwiktionary`, Sozdik.kz, and official/state dictionaries.
- Committed Kazakh fixtures are unblocked only for curated Kazakh Wiktionary content with attribution metadata and no placeholder-only entries.
- Offline Kazakh bundle is blocked until a bulk source/import path and attribution packaging are approved.
- Latin↔Cyrillic transliteration fallback requires a verified mapping table before production use.

## First Safe Task
Build a bounded native Kazakh Wiktionary extractor and measure representative coverage/placeholder rates before deciding whether the native corpus can support an offline pack or production promotion.

## Sources To Check
- Kazakh Wiktionary: https://kk.wiktionary.org/
- Kaikki Kazakh (English-edition): https://kaikki.org/dictionary/Kazakh/index.html
- Kaikki raw data (kkwiktionary): https://kaikki.org/dictionary/rawdata.html
- WiktAPI: https://wiktapi.dev/
- Sozdik.kz: https://sozdik.kz/
- Kazakh Language Committee: https://tildeu.gov.kz/
- UniMorph Kazakh: https://unimorph.github.io/
- Kazakh Latin alphabet (2021): https://en.wikipedia.org/wiki/Kazakh_alphabets
- TilAlemi NLP resources: https://github.com/tilalemi
