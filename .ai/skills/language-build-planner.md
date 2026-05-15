# Skill: Language Build Planner

## Trigger
Use this before adding support for a new language, script, morphology system, pronunciation feature, transliteration, or language-specific dictionary behavior.

## Inputs
- requested language and locale variants
- `data/languages.ts`
- `data/adapterRegistry.ts`
- existing morphology or dictionary modules
- available lexical source candidates and licenses

## Required Analysis
1. Identify language family, typology, and locale variants.
2. Determine script, writing direction, casing, and normalization needs.
3. Determine segmentation requirements for search and reader import.
4. Identify morphology needs such as gender, case, tone, classifiers, noun class, conjugation, or inflection.
5. Identify pronunciation fields such as IPA, romanization, kana, pinyin, or audio.
6. Identify dictionary source candidates and license risk.
7. Decide whether UI labels, sort order, or search behavior must change.
8. Propose the smallest adapter-first implementation path.

## Product Rules
- Build monolingual lookup first.
- Add bilingual dictionary only after a trustworthy lexical source is selected.
- Never use machine translation as dictionary data.
- Treat licensed offline dictionary bundles as blocked until licensing is resolved.

## Output Template
```md
Language:
Scope:
Script and normalization:
Search implications:
Morphology:
Pronunciation:
Data source candidates:
License risks:
Implementation plan:
Tests:
Blocked decisions:
```

## Done Criteria
- The plan separates unblocked code work from data/licensing decisions.
- Adapter changes are named before UI changes.
- Search and storage implications are explicit.
