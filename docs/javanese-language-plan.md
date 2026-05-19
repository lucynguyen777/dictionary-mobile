# Javanese Monolingual Baseline Plan

## Language Metadata
- **Code**: `jv`
- **Display name**: Basa Jawa (Javanese)
- **Family**: Austronesian (Malayo-Polynesian)
- **Script**: Latin (predominant modern digital standard) & Javanese script (Aksara Jawa / Carakan)
- **Writing direction**: LTR (Left-to-Right)

## Scope
Plan a monolingual Javanese dictionary lookup (JV→JV) and morphology baseline, focusing on register mapping (Ngoko vs. Krama), prefix/suffix agglutinative morphology, and local mockups.

## Orthography & Registers
- **Latin Script Priority**: Modern online Javanese communications and dictionaries predominantly use the Latin alphabet. Standard space-based tokenization in the Reader works perfectly.
- **Sociolinguistic Registers**:
  - Javanese uses distinct speech registers based on social context:
    - **Ngoko** (informal/casual): e.g., `mangan` (to eat), `tuku` (to buy), `omah` (house).
    - **Krama** (formal/polite): e.g., `nedha` / `dahar` (to eat), `tumbas` (to buy), `griya` (house).
  - In monolingual definitions and lookups, the adapter should display the register level (Ngoko/Krama) when available, and support cross-referencing between Ngoko and Krama synonyms.

## Morphology & Affixation Fallbacks
Javanese is highly agglutinative and features complex prefixation, suffixation, infixes, and confixes:
1. **Nasal Verb Prefixes (Active)**:
   - Root starts with `t` -> `n-` (e.g., `tulis` -> `nulis`, write)
   - Root starts with `w` / `p` -> `m-` (e.g., `waca` -> `maca`, read; `pangan` -> `mangan`, eat)
   - Root starts with `k` / vowel -> `ng-` (e.g., `kirim` -> `ngirim`, send; `ombe` -> `ngombe`, drink)
   - Root starts with `s` / `c` -> `ny-` (e.g., `silih` -> `nyilih`, borrow; `cukur` -> `nyukur`, shave)
2. **Passive Prefix (`di-`)**:
   - `diwaca` (is read) -> `waca` (read)
   - `ditulis` (is written) -> `tulis` (write)
3. **Causative/Locative Suffixes (`-i`, `-ake`)**:
   - `nulisake` (write for) -> `tulis`
   - `macaake` (read for) -> `waca`

### Morphology Candidates Strategy:
- **Direct Lookup**: Primary query.
- **Nasal Prefix Restoration**:
  - `n...` -> replace `n` with `t` (e.g., `nulis` -> `tulis`).
  - `m...` -> replace `m` with `p` or `w` (e.g., `maca` -> `waca`, `mangan` -> `pangan`).
  - `ng...` -> replace `ng` with `k` or vowel (e.g., `ngirim` -> `kirim`).
  - `ny...` -> replace `ny` with `s` or `c` (e.g., `nyilih` -> `silih`).
- **Passive Prefix Stripping**:
  - `di...` -> strip `di-` (e.g., `diwaca` -> `waca`).
- **Suffix Stripping**:
  - `...ake` / `...i` -> strip suffix.

## Data Source Candidates & Status
1. **Javanese Wiktionary (`jvwiktionary`)**:
   - WiktAPI query `https://api.wiktapi.dev/v1/jv/word/maca` is unavailable.
2. **Offline Dictionaries & Local Fixtures**:
   - Local mock entries will be created using standard Javanese grammar definitions.
   - Core test cases will cover basic registers and verb nasalization:
     - `waca` / `maca` / `diwaca` (read - Ngoko)
     - `tulis` / `nulis` (write - Ngoko)
     - `tuku` (buy - Ngoko) / `tumbas` (buy - Krama)

## Implementation Plan
1. **Metadata Configuration**:
   - Register `jv` in `data/languages.ts` with `dictionaryStatus: 'monolingual'` and `adapterKey: 'jv'`.
2. **Morphology Rules (`data/morphology.ts`)**:
   - Implement `getJavaneseMorphologyCandidates(input: string)` using active/passive prefix and suffix rules.
3. **Local Lexicon Fixtures (`data/localLexicon.ts`)**:
   - Add monolingual fixtures for `waca`, `tulis`, `tuku`, and `tumbas`.
4. **Adapter Integration & Dispatch**:
   - Register the Javanese adapter in `data/adapterRegistry.ts` and dispatch to `fetchJavaneseMeaning` / `fetchJavaneseRelatedWords`.
5. **Unit Tests**:
   - Write tests under `tests/dictionaryApi.test.ts` to cover exact lookups, active nasalization, passive voice, and suffix stripping.
