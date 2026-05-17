# Etymology & Conjugation Source Decision

## Use when
This decision documents the chosen legal structured source for etymology and conjugation data used in production features (Etymology, Conjugation tabs, and related UI).

## Background
Etymology and conjugation are desirable advanced features but require a structured, legally-sound data source. Production integration must not rely on scraped or unlicensed data.

## Candidate Options
- Option A — Wiktionary / WiktAPI or Wiktionary-derived dumps
  - Pros: free, community-maintained, broad language coverage for many headwords.
  - Cons: spotty structured data for some languages; WiktAPI endpoints may be rate-limited or inconsistent; requires normalization and legal review for production use.

- Option B — Licensed lexical provider (commercial API or dataset)
  - Pros: consistent structured fields, SLAs, and legal clarity.
  - Cons: cost, vendor lock-in, integration and privacy considerations.

- Option C — Open structured datasets (UniMorph derivatives, academic corpora)
  - Pros: permissive licenses in some cases; good for conjugation/morphology extraction.
  - Cons: may not include etymology; variable coverage and format differences.

- Option D — Keep production integration blocked; provide local preview or authoring tools until a vetted source is selected.
  - Pros: safe, avoids legal risk.
  - Cons: delays feature availability.

## Evaluation Criteria
- License & terms: must be compatible with our distribution model.
- Structured fields: etymology text, conjugation tables or machine-readable morphology, language coverage for priority languages.
- Accessibility: API or downloadable dump, update cadence, and rate limits.
- Quality: accuracy, completeness for priority headwords.
- Cost: price and budget impact if commercial.

## Recommended Next Steps
1. Product owner to pick one of the options above or request research for an alternative.
2. Legal team (or product owner) to confirm licensing/usage rights for the chosen option.
3. Engineering to perform a smoke test on a small set of sample headwords (monolingual) and document extraction results in the PR.
4. If approved, implement an adapter in `data/adapterRegistry` and add tests + integration checks.

## Acceptance Criteria
- A chosen option documented in this file and approved by the product owner.
- A short smoke-test plan and sample results included in the PR that implements the adapter.
- If a commercial provider is chosen, acceptable licensing/contract terms are confirmed.

