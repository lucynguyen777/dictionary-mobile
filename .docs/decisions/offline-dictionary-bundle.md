# Decision: Offline Dictionary Bundle

## Status
Accepted

## Context
The app currently relies on online API lookups (WiktAPI, MinhQnd, etc.) for dictionary data. Offline dictionary support would enable:
- Lookup without network connectivity
- Faster response times (no API latency)
- Reduced API rate limit concerns
- Better user experience in low-connectivity environments

However, offline bundling introduces:
- App size constraints (mobile app stores have limits)
- Legal/licensing obligations (CC BY-SA share-alike, attribution)
- Update/versioning complexity
- Storage and indexing performance considerations
- Language coverage decisions (which languages to bundle)

Related decisions:
- `.docs/decisions/dictionary-source-licensing.md` (Accepted)
- `.docs/decisions/etymology-conjugation-source.md` (Accepted)

## Requirements
- Use data sources compatible with offline redistribution under their licenses
- Keep attribution visible and compliant with CC BY-SA/GFDL requirements
- Maintain reasonable app size (target: <100MB base app, optional language packs)
- Support incremental updates without full re-download
- Provide clear UI for download/storage management
- Preserve existing online-first behavior as default; offline as opt-in enhancement
- Do not bundle data that requires per-query API authentication or violates ToS

## Options

### Option 1: Wiktionary/Kaikki offline bundles (CC BY-SA)
**Approach**: Package Kaikki/Wiktextract JSON dumps as SQLite databases or compressed JSON, bundled with the app or downloaded on-demand.

**Pros**:
- Consistent with accepted etymology/conjugation source decision
- CC BY-SA 4.0 license permits redistribution with attribution
- Broad language coverage (Kaikki extracts from 200+ Wiktionary editions)
- Structured data (definitions, POS, IPA, etymology, inflections)
- Community-maintained, regularly updated dumps

**Cons**:
- Large dataset sizes (English Wiktionary alone: ~2GB raw JSON)
- Requires compression, indexing, and selective language packaging
- Attribution UI must be implemented per CC BY-SA requirements
- Share-alike obligation: any derivative work must also be CC BY-SA
- Data quality varies by language edition
- Update frequency depends on Kaikki dump schedule

**Implementation notes**:
- Use SQLite FTS5 for full-text search indexing
- Compress with gzip or brotli for storage
- Offer per-language download packs (e.g., "English offline", "Vietnamese offline")
- Display attribution in app settings and per-entry source metadata
- Implement delta updates using version checksums

### Option 2: Commercial licensed offline bundle
**Approach**: License a commercial dictionary dataset (e.g., Oxford, Collins, Merriam-Webster) for offline bundling.

**Pros**:
- Professional editorial quality
- Clear licensing terms for redistribution
- Potentially smaller, curated datasets
- May include audio, images, usage notes

**Cons**:
- Cost (licensing fees, per-user or per-download)
- Vendor lock-in
- Limited language coverage (most commercial dictionaries focus on major languages)
- May prohibit derivative works or require backend authentication
- Incompatible with open-source distribution model

**Verdict**: Not recommended unless the app adopts a paid/subscription model and targets only major commercial languages.

### Option 3: User-imported dictionary bundle
**Approach**: Allow users to import their own offline dictionary files (e.g., StarDict, XDXF, or custom JSON formats).

**Pros**:
- No licensing burden on the app
- User controls data source and quality
- Supports niche or proprietary dictionaries
- Flexible for academic/research use cases

**Cons**:
- No default offline experience (users must find and import data)
- Inconsistent data quality and format
- Complex import/validation UI
- No guarantee of attribution compliance (user responsibility)
- Limited discoverability for average users

**Verdict**: Good as a supplementary feature, but not a replacement for built-in offline support.

### Option 4: Online lookup only (status quo)
**Approach**: Continue relying on API-based lookups; do not bundle offline data.

**Pros**:
- Minimal app size
- No licensing/attribution complexity
- Always up-to-date data
- No storage management UI needed

**Cons**:
- Requires network connectivity
- API rate limits and latency
- Poor user experience in offline scenarios
- Dependent on third-party API availability

**Verdict**: Acceptable as default, but offline support is a high-value feature for language learners.

## Recommendation
**Adopt Option 1 (Wiktionary/Kaikki offline bundles) as the primary offline strategy**, with Option 3 (user-imported bundles) as a secondary enhancement.

**Staged implementation**:
1. **Phase 1 (MVP)**: Single-language offline pack (e.g., English) as an optional download, using compressed Kaikki JSON + SQLite FTS5 indexing.
2. **Phase 2**: Multi-language packs with per-language download management UI.
3. **Phase 3**: Delta updates and background sync for offline data.
4. **Phase 4**: User-imported dictionary support for advanced users.

**Attribution compliance**:
- Display "Powered by Wiktionary (CC BY-SA 4.0)" in app settings
- Include per-entry source attribution (e.g., "Source: English Wiktionary")
- Link to full license text and Wiktionary contributors page
- Ensure any derivative datasets are also CC BY-SA licensed

**App size management**:
- Base app: <50MB (no offline data bundled by default)
- Per-language pack: 10-50MB compressed (varies by language)
- Total storage limit: user-configurable, default 500MB
- Warn users before downloading large packs on cellular

## Decision
Chosen option: **Option 1 — Wiktionary/Kaikki offline bundles (CC BY-SA)**, with staged implementation and optional per-language downloads.

Scope note:
- This decision unblocks offline dictionary planning and prototyping.
- Implementation remains subject to app size testing, attribution UI completion, and per-language pack validation.
- User-imported bundles (Option 3) may be added later as a supplementary feature.

## Consequences
- Offline dictionary feature is now unblocked for implementation planning
- Attribution UI must be built before any offline data is bundled or distributed
- App size will increase with optional language packs; base app remains lightweight
- SQLite FTS5 indexing and compression strategy must be prototyped and tested
- Update mechanism (delta updates, version checksums) must be designed
- Language coverage will be incremental (start with high-demand languages)
- Share-alike obligation applies: any derivative datasets must remain CC BY-SA

## Tasks Unblocked If Accepted
- Offline dictionary database schema design (SQLite + FTS5)
- Kaikki data extraction and compression pipeline
- Per-language offline pack generation and hosting
- Attribution UI implementation (settings page, per-entry source display)
- Download management UI (language pack selection, storage limits, progress)
- Offline search indexing and query optimization
- Delta update mechanism for offline data versioning
- User-imported dictionary format specification (Phase 4)

## Sources Checked
- Kaikki machine-readable Wiktionary extracts: https://kaikki.org/
- Kaikki raw data downloads: https://kaikki.org/dictionary/rawdata.html
- Wiktionary copyright/license: https://en.wiktionary.org/wiki/Wiktionary:Copyrights
- CC BY-SA 4.0 license: https://creativecommons.org/licenses/by-sa/4.0/
- SQLite FTS5 documentation: https://www.sqlite.org/fts5.html
