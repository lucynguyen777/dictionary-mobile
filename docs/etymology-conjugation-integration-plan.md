# Etymology And Conjugation Integration Plan

This plan turns the accepted source decision in `.docs/decisions/etymology-conjugation-source.md` into implementation-ready guidance without faking production lexical data.

## Current Audit

- Word detail already has `Conjugation` and `Etymology` tabs in `components/word/TabPager.tsx`.
- Etymology display already flows through `data/etymologyAdapter.ts`, with source-aware fallback copy and attribution formatting covered by `tests/etymologyAdapter.test.ts`.
- Word lookup merges local fixtures, API meanings, and fallback dictionary entries in `app/(tabs)/word.tsx`; etymology text is currently display-ready string data, not a structured production source record.
- Conjugation display currently reads `entry.conjugation` arrays from local dictionary-style entries and morphology fixtures. It does not yet have a UniMorph-backed source contract.
- Offline dictionary rows already include an `etymology` field, but offline/bulk etymology or UniMorph packaging must remain gated by source licensing and ShareAlike-compatible pack review.

## Source Contracts

### Wiktionary-Derived Etymology

Use Wiktionary/Wiktextract/Kaikki-derived etymology only when the result can carry:

- source name, source URL, license, attribution label, and retrieval or dump date;
- language code and headword;
- raw source text or normalized display text;
- missing/partial data state when the source exists but has no structured etymology for the entry.

UI must show attribution at entry level. Missing data must say that the source is selected but no structured etymology is available for the entry; it must not fall back to invented origin text.

### UniMorph-Style Conjugation

Use UniMorph-style data only as morphology/paradigm data, not as dictionary definition or etymology content. Each paradigm row should preserve:

- language code, lemma, form, feature bundle, source name, source URL or dataset id, license, and retrieval/dump date;
- confidence or coverage state when language support is partial;
- a display grouping contract for tense/aspect/mood/person/number where the source provides those features.

Conjugation tabs should keep local morphology fixtures visibly separate from production paradigms.

## Fallback Policy

- No selected source: show source-unavailable copy and keep the feature in staged rollout state.
- Selected source with no entry data: show source-aware missing-data copy.
- Local educational fixture: show preview copy with non-production attribution.
- Bilingual lookup: keep monolingual-only etymology restrictions unless a trusted bilingual lexical source explicitly includes etymology.
- Offline/bulk data: do not package Wiktionary/Kaikki/UniMorph-derived datasets until the pack manifest, attribution UI, license, and ShareAlike separation are reviewed for that pack.

## Focused Test Expectations

Future implementation should add or extend focused tests for:

- etymology attribution when Wiktionary-derived data exists;
- selected-source missing etymology fallback;
- local fixture preview attribution that cannot be mistaken for production data;
- UniMorph-style paradigm parsing and grouped display for one tiny fixture language;
- partial language coverage state when a lemma has no paradigm rows;
- offline/bulk packaging gate that prevents packed etymology/conjugation data without source/license metadata.

## Implementation Readiness

The next implementation module may move from planning to `[ ] TODO` when it includes 3-5 tasks that:

1. add structured etymology source metadata to the lookup data flow;
2. keep current UI fallback behavior compatible;
3. add one tiny attributed etymology fixture or live-source fixture path;
4. add one tiny UniMorph-style conjugation/paradigm parser fixture;
5. verify attribution, missing-source fallback, and no-mock production behavior.
