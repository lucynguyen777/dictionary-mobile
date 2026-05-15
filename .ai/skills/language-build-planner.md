# Skill: Language Build Planner

## Use when
Use this before adding support for a new language, script, morphology system, pronunciation feature, transliteration, segmentation behavior, or language-specific dictionary adapter.

## Context to read first
- `.ai/agents/language-adapter.md`
- `.ai/prompts/create-language-adapter-plan.md`
- `.ai/skills/dictionary-adapter-builder.md`
- `.ai/skills/blocked-task-gatekeeper.md`
- `docs/product-progress.md`
- `data/languages.ts`
- `data/adapterRegistry.ts`
- existing morphology and dictionary modules
- `.docs/decisions/dictionary-source-licensing.md`
- `.docs/decisions/offline-dictionary-bundle.md`

## Workflow
1. Identify language family, typology, and locale variants.
2. Determine script, writing direction, casing, normalization, and sorting needs.
3. Determine segmentation requirements for search and reader import.
4. Identify morphology needs such as gender, case, tone, classifiers, noun class, conjugation, or inflection.
5. Identify pronunciation fields such as IPA, romanization, kana, pinyin, transliteration, or audio.
6. Identify dictionary source candidates and license risk.
7. Decide UI/search/storage implications.
8. Propose the smallest adapter-first implementation path.

## Rules
- Build monolingual lookup first.
- Add bilingual dictionary only after a trustworthy lexical source is selected.
- Never use machine translation as dictionary data.
- Treat licensed offline dictionary bundles as blocked until licensing is resolved.
- Do not treat disputed macro-families as production taxonomy.

## Output
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
First safe task:
```

## Stop conditions
- Stop if no trustworthy legal source candidate exists for the requested scope.
- Stop if the language requires a production offline bundle decision.
- Stop if backend translation is being requested as dictionary data.
