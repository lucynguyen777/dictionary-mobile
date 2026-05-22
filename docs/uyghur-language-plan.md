# Uyghur Monolingual Baseline Plan

## Language
- Code: `ug`
- Name: Uyghur (ئۇيغۇرچە / Uyghurche)
- Family: Turkic, Karluk branch (closely related to Uzbek; more distant from Turkish/Kazakh)
- Primary script: modern Uyghur Arabic/Perso-Arabic script (UEY), right-to-left.
- Secondary scripts:
  - Uyghur Latin Yëziqi (ULY), mainly auxiliary/online romanization.
  - Uyghur Cyrillic, mostly among Central Asian Uyghur communities.
- Baseline target: `ug -> ug` monolingual lookup before any bilingual Uyghur pair.

## Scope
This is a planning and gate document only. Do not add Uyghur metadata or adapter code until a true Uyghur-definition source, fixture policy, RTL smoke plan, and attribution/terms requirements are accepted.

## Current Code Audit
- `data/languages.ts` does not register `ug` yet.
- The app already has RTL handling for Arabic and Hebrew in lookup inputs, saved-word display, and detail surfaces; Uyghur can reuse the RTL direction path, but it still needs language-specific smoke because Uyghur Arabic letters and vowels differ from Arabic.
- `data/languageNormalization.ts` currently has locale overrides for Turkish and Kazakh only.
- `data/localLexicon.ts`, `data/dictionaryApi.ts`, `data/adapterRegistry.ts`, and `data/morphology.ts` have no Uyghur adapter/fixtures.
- Existing Turkic baselines:
  - Turkish: implemented Latin-script source-backed fixture adapter and suffix fallback.
  - Uzbek: planned but blocked pending true Uzbek definitions.
  - Kazakh: implemented small Cyrillic-script baseline from curated Kazakh Wiktionary fixtures.

## Comparison With Turkish / Uzbek / Kazakh
- Uyghur is Karluk Turkic like Uzbek, but its dominant script is **Arabic-derived RTL**, not Latin/Cyrillic.
- Unlike Uzbek Latin, Uyghur Arabic orthography writes vowels as full letters; normalization must preserve those letters and should not apply Arabic-language assumptions.
- Unlike Kazakh Cyrillic, Uyghur needs bidi/RTL smoke and possible zero-width joiner/non-joiner handling.
- Uyghur keeps Turkic agglutinative suffixing, but source-provided forms should come before local stem guessing.
- ULY can help search, but the first baseline should store/display canonical Uyghur Arabic script.

## Script And Normalization
- Normalize all text to NFC before lookup.
- Preserve canonical Uyghur Arabic letters and vowel letters; do not strip or fold them into Arabic/Persian approximations.
- Preserve display script exactly; use RTL rendering for input, chips, examples, and word-detail text.
- Handle common invisible characters only after tests:
  - zero-width non-joiner / zero-width joiner around suffix boundaries;
  - bidi marks copied from web pages;
  - Tatweel/kashida if user input includes decorative stretch.
- First lookup order should be:
  1. Exact Uyghur Arabic headword.
  2. Source-provided form match from accepted fixtures/source data.
  3. ULY romanization fallback (`öy -> ئۆي`, `kitab -> كىتاب`) only after a verified table.
  4. Conservative suffix fallback only after source forms are exhausted.

## Morphology
Uyghur is agglutinative and suffix-heavy.

### Nouns
- Plural suffix: `-لار/-لەر` (`-lar/-ler`) with vowel harmony.
- Case suffixes to plan for:
  - genitive `-نىڭ/-نىڭ` style forms (`-ning`);
  - accusative `-نى/-نى` (`-ni`);
  - dative `-غا/-گە/-قا/-كە` (`-gha/-ge/-qa/-ke`);
  - locative `-دا/-دە/-تا/-تە` (`-da/-de/-ta/-te`);
  - ablative `-دىن/-دىن` variants (`-din`);
  - locative-qualitative forms such as `-دىكى`.
- Possessive suffixes can stack before case; first baseline should avoid broad possessive stripping unless source forms prove it.
- Example forms from Kaikki English-edition smoke:
  - `كىتاب` -> `كىتابلار`, `كىتابنىڭ`, `كىتابنى`, `كىتابدا`, `كىتابدىن`
  - `ئۆي` -> `ئۆيلەر`, `ئۆينىڭ`, `ئۆينى`, `ئۆيگە`, `ئۆيدە`, `ئۆيدىن`

### Verbs
- Citation/infinitive forms often end in `-ماق/-مەك` (`-maq/-mek`), e.g. `كەلمەك`, `يېمەك`, `ئوقۇماق`.
- Verb fallbacks should cover only source-proven forms at first:
  - infinitive `-ماق/-مەك`;
  - negative `-ما/-مە`;
  - past and participial forms after source smoke;
  - person endings only after fixture evidence.
- Do not port Turkish verb fallback directly; Uyghur orthography and suffix shapes differ.

### Adjectives
- Basic adjectives such as `ياخشى` and `يامان` are present in English-edition Kaikki data.
- Comparative/intensifier patterns should be deferred until source examples are available.

## Pronunciation
- IPA/audio must be source-backed.
- Kaikki English-edition data includes IPA for sampled entries such as `كىتاب`, `ئۆي`, `ياخشى`, `كەلمەك`, `يېمەك`, and `ئوقۇماق`.
- Do not synthesize IPA locally.

## Data Source Candidates

### 1. Uyghur Wiktionary (`ug.wiktionary.org`)
- Native Uyghur Wiktionary edition exists and reports `rtl` in MediaWiki siteinfo.
- Site license smoke reports Creative Commons Attribution-Share Alike 4.0.
- MediaWiki API page smoke:
  - `ئۆي` contains native Uyghur definitions and examples.
  - `كىتاب` exists but currently uses a missing-definition placeholder.
- Decision: strongest future source candidate, but adapter remains blocked until a broader smoke finds enough non-placeholder noun/adjective/verb entries.

### 2. Kaikki English-edition Uyghur entries
- URL: `https://kaikki.org/dictionary/Uyghur/index.html`
- Machine-readable Uyghur entries derived from English Wiktionary.
- Local smoke downloaded the postprocessed JSONL and found entries/forms for `كىتاب`, `ئۆي`, `ياخشى`, `يامان`, `كەلمەك`, `يېمەك`, `ئوقۇماق`, and `بارماق`.
- Useful for forms, IPA, romanization, morphology tests, and source smoke.
- Not a valid `ug -> ug` definition source by itself because glosses are English.

### 3. Kaikki/Wiktextract `ugwiktionary` raw dump
- `https://kaikki.org/ugwiktionary/rawdata.html` returned HTTP 404 in the May 22, 2026 smoke.
- Decision: blocked until Kaikki publishes a dedicated Uyghur Wiktionary edition extract.

### 4. Hosted WiktAPI Uyghur edition
- Direct/search smoke for `كىتاب` and `ئۆي` returned empty search arrays or 404-style JSON.
- Decision: do not rely on hosted WiktAPI for first Uyghur adapter.

### 5. Other Uyghur dictionary portals and academic resources
- Candidate only after explicit API/terms/license approval.
- Academic corpora/treebanks can help future morphology or segmentation, but they are not dictionary-definition sources.

## License Risks
- Uyghur Wiktionary-derived data follows CC BY-SA attribution and ShareAlike requirements.
- Kaikki English-edition Uyghur data inherits Wiktionary-derived attribution but cannot substitute for native definitions.
- Third-party dictionary portals require explicit approval before fixtures, scraping, or production use.
- Offline/bundled Uyghur data remains subject to `docs/decisions/offline-dictionary-bundle.md`.

## Implementation Plan (Gated)
> Do not proceed past Step 1 until enough true Uyghur-definition fixtures are accepted.

1. **Extended source smoke**: sample `ug.wiktionary.org` pages for at least three non-placeholder entries across noun/adjective/verb.
2. **RTL UI smoke plan**: verify Word search input, result chips, WordHeader, definition/examples, saved words, and search history with Uyghur Arabic text.
3. **Metadata configuration**: register `ug` in `data/languages.ts` with `writingDirection: 'rtl'`, `script: 'arabic'`, and `dictionaryStatus: 'monolingual'` only after source acceptance.
4. **Normalization tests**: preserve Uyghur Arabic letters, strip only approved invisible/decorative characters, and keep ULY romanization as optional search fallback.
5. **Local fixtures**: seed only CC BY-SA-attributed native Uyghur definitions, avoiding placeholder pages like `كىتاب`.
6. **Adapter integration**: add `fetchUyghurMeaning`, `fetchUyghurRelatedWords`, and registry wiring.
7. **Morphology tests**: exact match, source-provided form fallback, plural/case stripping, and one verb form only if fixture evidence supports it.

## Tests Needed
- `data/languages.ts` metadata test after adding `ug`.
- `data/languageNormalization.ts` tests for Uyghur Arabic letters, RTL-safe trimming, and optional ZWNJ/ZWJ handling.
- `data/adapterRegistry.ts` dispatch test after adapter registration.
- Dictionary API/adapter tests for accepted Uyghur source fixtures.
- Browser smoke for RTL Uyghur lookup display once metadata becomes user-visible.

## Blocked Decisions
- Production Uyghur monolingual lookup remains blocked until a native Uyghur-definition source sample set is accepted.
- Committed Uyghur fixtures are blocked until the chosen entries are non-placeholder and carry source/license metadata.
- Offline Uyghur bundle is blocked until a bulk source and attribution packaging are approved.
- ULY romanization fallback requires a verified mapping table before production use.

## First Safe Task
Run the extended Uyghur Wiktionary MediaWiki source smoke described in `docs/uyghur-source-smoke.md`. If it finds enough non-placeholder entries, submit the fixture/license decision and then add a tiny RTL Uyghur baseline adapter.

## Sources To Check
- Uyghur Wiktionary API: https://ug.wiktionary.org/w/api.php
- Kaikki Uyghur English-edition data: https://kaikki.org/dictionary/Uyghur/index.html
- Kaikki raw data page: https://kaikki.org/dictionary/rawdata.html
- WiktAPI: https://wiktapi.dev/
- Wikimedia User-Agent policy: https://foundation.wikimedia.org/wiki/Policy:Wikimedia_Foundation_User-Agent_Policy/en
- Uyghur Latin Yëziqi PDF: https://www.uyghur-language.net/sites/www.uyghur-language.net/files/PDF/Uyghur%20Latin%20Yeziqi.pdf
