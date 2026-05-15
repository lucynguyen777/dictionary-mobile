# Skill: Dictionary Adapter Builder

## Trigger
Use this when adding or changing dictionary lookup adapters, local lexicon behavior, morphology helpers, search normalization, or language-specific lookup logic.

## Inputs
- `data/adapterRegistry.ts`
- `data/dictionaryApi.ts`
- `data/dictionary.ts`
- `data/localLexicon.ts`
- `data/morphology.ts`
- `data/languages.ts`
- related tests in `tests/`

## Workflow
1. Read the adapter registry and existing adapter shape before adding new behavior.
2. Keep adapter interfaces stable unless all callers and tests are updated.
3. Prefer language-specific normalization inside the adapter or helper, not scattered across screens.
4. Return structured dictionary entries that match existing UI expectations.
5. Handle no-result, partial-result, and unsupported-language cases explicitly.
6. Add or update tests for registry behavior and lookup output.
7. Keep network or licensed-data assumptions out unless the product decision exists.

## Adapter Checklist
- language id is registered
- display metadata exists in `data/languages.ts`
- lookup function handles empty and malformed input
- normalization is deterministic
- morphology output is optional and typed
- fallback behavior is explicit
- tests cover success and no-result paths

## Guardrails
- Do not use machine translation as source dictionary content.
- Do not hardcode large lexical datasets directly into source files.
- Do not break existing adapter tests.
- Do not add production remote calls without privacy, quota, and offline decisions.

## Done Criteria
- Adapter is discoverable through the registry.
- Existing dictionary API callers still work.
- Tests document the expected lookup behavior.
