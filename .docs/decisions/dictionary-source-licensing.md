# Decision: Dictionary Source Licensing

## Status
Accepted

## Context
Production dictionary features require trustworthy lexical sources with licenses that allow app usage, redistribution where needed, and offline packaging where applicable. Since hosted WiktAPI direct lookups are unreliable for complex casing, and many national editions do not exist on WiktAPI, using open lexical datasets (like Kaikki raw dumps) and public open APIs (like South Korea's NIKL Open API) is critical.

## Options
1. **Public/National Open APIs with permitted usage** (e.g., South Korea's National Institute of Korean Language API).
2. **Open Wiktionary-derived lexical datasets** (e.g., Kaikki/Wiktextract raw JSONL dumps under CC BY-SA 3.0/4.0).
3. **Commercial licensed dictionary data** (Proprietary, currently blocked due to licensing costs).
4. **User-provided personal dictionaries** (e.g., importing local MDict/StarDict files).

## Decision
We choose **Option 1 (Public/National Open APIs)** and **Option 2 (Open Wiktionary-derived datasets)** as our primary unblocking strategies.

### Policy Rules for Option 2 (Wiktionary CC BY-SA Data):
1. **Attribution Requirement**: The app must contain a dedicated Credits/Acknowledgements screen in the Profile settings sidebar that clearly attributes Wiktionary and Kaikki, linking to their respective licenses.
2. **Committed Fixtures**: Tiny curated JSON/JSONL fixtures (limited to 3-5 sample words) are allowed in `tests/fixtures/` solely for test verification, provided they contain an accompanying `.license` file or header attributing the source.
3. **Redistribution & Bundling**: Offline bundles derived from Wiktionary must comply with the ShareAlike (SA) clause. These must remain completely open and separate from proprietary application code.

## Consequences
- **Cost**: $0 USD for licensing, keeping the project budget-friendly.
- **Attribution**: Requires a visible acknowledgement screen, which has already been prepared in the sidebar structure.
- **Accuracy**: Extremely high, especially for Korean (via NIKL Open API) and Finnish/Turkish/Japanese (via direct community Wiktionary editions).
- **Off-line readiness**: Enables offline compilation of target language structures without copyright infringement.

## Tasks Unblocked
- [x] Unblock Turkish monolingual dictionary adapter implementation (via `trwiktionary` dump fixtures).
- [x] Unblock Finnish monolingual dictionary adapter implementation (via `fiwiktionary` dump fixtures).
- [x] Unblock Japanese monolingual dictionary adapter implementation (via `jawiktionary` dump fixtures).
- [x] Unblock Korean monolingual dictionary adapter implementation (via NIKL Open API and `kowiktionary` dumps).
- [x] Unblock Cantonese monolingual dictionary adapter implementation (via Words.hk open CC BY-SA data).
