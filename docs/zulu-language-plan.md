# Zulu Monolingual Baseline Plan

## Language Metadata
- **Code**: `zu`
- **Display name**: isiZulu (Zulu)
- **Family**: Niger-Congo (Bantu, Nguni)
- **Script**: Latin
- **Writing direction**: LTR (Left-to-Right)

## Scope
Plan a monolingual Zulu dictionary lookup (ZU->ZU), focusing on noun class prefixes, agglutinative morphology, and local fixture gates before any bilingual expansion.

## Current Code Audit
- Status refreshed: June 12, 2026.
- Implemented in code: `zu` is registered in `data/languages.ts` with `dictionaryStatus: 'monolingual'` and `adapterKey: 'zu'`; `data/adapterRegistry.ts` dispatches to `fetchZuluMeaning` and `fetchZuluRelatedWords`.
- Fixture/runtime path: local Zulu fixtures, noun-class prefix fallback, locative fallback, dictionary-tone-insensitive lookup, and related-word lookup are wired through `data/localLexicon.ts`, `data/morphology.ts`, and `data/dictionaryApi.ts`.
- Production source audit: `docs/zulu-production-source-audit.md` records hosted API failure, English-definition Kaikki ineligibility, and the undersized/incomplete native Zulu Wiktionary corpus.
- Remaining gate: broader Zulu production/bulk coverage still needs a stable approved measured source and attribution packaging.

## Orthography & Normalization
- Zulu uses a Roman-based orthography with standard word spacing, so the existing Reader tokenization path can start with the Latin-script flow.
- Search should be case-insensitive and preserve digraph/trigraph consonants such as `hl`, `dl`, `sh`, `tsh`, `ng`, and click letters `c`, `q`, `x`.
- Tone and vowel length are meaningful in speech but are generally not written in ordinary Zulu text, so lookup normalization should not depend on tone marks.

## Morphology & Noun Class Strategy
Zulu is a Bantu language with noun class agreement and heavy prefixation. The baseline should compare against the existing Swahili and Yoruba Niger-Congo adapters:
- **Swahili comparison**: like Swahili, Zulu has noun class prefix pairs, but Zulu class prefixes often include an augment/initial vowel such as `u-`, `i-`, or `a-`.
- **Yoruba comparison**: unlike Yoruba tone-safe lookup, Zulu baseline search is primarily class-prefix and locative-aware, not tone-mark-driven.
- **Primary noun class pairs for lookup fallbacks**:
  - `um(u)-` / `aba-` for class 1/2 people, e.g. `umuntu` -> `abantu`.
  - `um(u)-` / `imi-` for class 3/4 plants or body parts.
  - `i(li)-` / `ama-` for class 5/6 nouns.
  - `isi-` / `izi-` for class 7/8 objects, customs, and languages.
  - `in-/im-/i-` / `izin-/izim-` for class 9/10 animals and many loanwords.
  - `u(lu)-` / `izin-/izim-` for class 11/10 long or thin objects.
- **Locative fallback**: many locatives use `e-` plus `-ini` or vowel-conditioned variants. The first implementation should only attempt conservative local fixture-backed fallbacks, not a full morphological analyzer.
- **Verb fallback**: Zulu verbs carry subject/object concords, tense/aspect markers, and suffixes. Baseline implementation may include tiny fixture-backed infinitive `uku-` forms, but broad verb lemmatization should remain out of scope until nouns pass tests.

## Data Source Candidates & Status
| Source | Type | Status | License |
|--------|------|--------|---------|
| Zulu Wiktionary / Kaikki-derived data | Structured dump candidate | Candidate for local fixtures | CC BY-SA |
| WiktAPI Zulu edition (`zu`) | Hosted REST candidate | Needs endpoint smoke test | WiktAPI/Kaikki-derived |
| English Wiktionary Zulu entries | Hosted/offline fallback | Not enough for monolingual-first by itself | CC BY-SA |

### Source Gate
- The project already accepts CC BY-SA Wiktionary-derived local fixtures for monolingual baselines, but Zulu implementation must verify that fixture definitions are Zulu-language definitions, not English glosses.
- If a hosted `zu` WiktAPI endpoint returns 404 or English-only glosses for sample words, implementation should stay local-fixture-first until a stable source is confirmed.

## Implementation Plan
1. **Metadata Configuration**:
   - Register `zu` in `data/languages.ts` with `family: 'niger-congo'`, `script: 'latin'`, `writingDirection: 'ltr'`, `adapterKey: 'zu'`, and `dictionaryStatus: 'monolingual'` once fixtures exist.
2. **Local Lexicon Fixtures (`data/localLexicon.ts`)**:
   - Add a tiny Zulu fixture set for common nouns such as `umuntu`, `abantu`, `inja`, `izinja`, and `isiZulu`.
   - Include part of speech, Zulu definition text, Vietnamese support text, pronunciation/IPA when available, and clear CC BY-SA attribution in source fields.
3. **Morphology Rules (`data/morphology.ts`)**:
   - Add conservative prefix-pair candidates for fixture-backed noun class plural/singular lookup.
   - Add locative `e-...-ini` fallback only for covered examples.
4. **Adapter Integration & Dispatch**:
   - Register a `zu` adapter in `data/adapterRegistry.ts` and dispatch `fetchZuluMeaning` / `fetchZuluRelatedWords` from `data/dictionaryApi.ts`.
5. **Unit Tests**:
   - Cover exact noun lookup, plural-to-singular class prefix fallback, optional locative fallback, and related-word lookup under `tests/dictionaryApi.test.ts`.
6. **Production readiness follow-up**:
   - Keep promotion corpus-blocked until an approved measured Zulu-definition corpus and attributed offline candidate pass.

## Research Sources
- Wiktionary Appendix: Zulu nouns, for noun class and prefix overview.
- MustGo Zulu language profile, for orthography, tone, noun class, and agglutinative grammar notes.
- Pretorius & Bosch, "Finite-state computational morphology: An analyzer prototype for Zulu", for noun prefix classes and concordial agreement implications.
