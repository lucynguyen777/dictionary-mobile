# Hindi Monolingual Baseline Plan

## Language
- Code: `hi`
- Display name: हिन्दी (Hindi)
- Family: Indo-European (Indo-Aryan)
- Script: Devanagari
- Writing direction: LTR

## Scope
Plan a monolingual Hindi dictionary lookup (HI→HI).

## Script And Normalization
- Written in Devanagari script.
- **Casing**: Devanagari does not have upper/lower case. Case-insensitive search is irrelevant for the native script, but `.toLocaleLowerCase()` can still be safely applied without modifying Devanagari characters.
- **Normalization**: Unicode Normalization Form C (NFC) is strictly required. Devanagari characters can be represented as pre-composed characters or as base consonant + dependent vowel signs (matras). NFC ensures consistent matching.
- **Transliteration Strategy**: Since many users type Hindi using Latin script keyboards (e.g., typing "namaste" instead of "नमस्ते"), the app ideally needs a transliteration layer (handling IAST or common informal Romanization) to map Latin input to Devanagari before querying the dictionary. This is a complex requirement unique to non-Latin scripts.

## Morphology
Hindi is highly inflected:
- **Nouns**: Have gender (masculine/feminine), number (singular/plural), and case (direct/oblique/vocative). Plurals and oblique forms change the word ending (e.g., *larka* -> *larke* -> *larkon*).
- **Verbs**: Conjugate for person, number, gender, tense, aspect, and mood.
- A basic morphology candidate generator would strip common inflectional suffixes (e.g., `-े` (e), `-ों` (on), `-ी` (i)) to find the lemma.

## Pronunciation
- Devanagari is largely phonetic.
- IPA can be algorithmic or provided by a source.

## Data Source Candidates & Blocker
| Source | Type | Status | License |
|--------|------|--------|---------|
| WiktAPI (Hindi Wiktionary `hi`) | REST API | **BLOCKED (404)** | N/A |
| WiktAPI (English Wiktionary `en`) | REST API | **Violates Rules** | CC-BY-SA 3.0 |
| Free Dictionary API | REST API | Yes (via Google Dictionary) | N/A |

### The Monolingual Blocker
- Testing `https://api.wiktapi.dev/v1/hi/word/नमस्ते` returns a **404 error**, indicating that the `hi` edition of Wiktionary is not supported or extracted by WiktAPI.
- While the `en` edition of WiktAPI contains Hindi words (`lang_code: hi`), it provides **English definitions**. Using this would create a bilingual (HI→EN) dictionary.
- The **Free Dictionary API** (dictionaryapi.dev) supports Hindi, but it is notoriously unmaintained and often fails. It is also unclear if its Hindi data is strictly monolingual or bilingual.
- The project rules strictly mandate a **monolingual-first** build (`HI→HI`). Since no reliable, structured monolingual API is available, the implementation is blocked.

## Implementation Plan
1. ✅ Add `hi` language metadata to `data/languages.ts` but mark it as `dictionaryStatus: 'unavailable'` so the UI shows "Coming soon" (Sắp hỗ trợ).
2. 🔲 Blocked: Do not register a Hindi adapter until a monolingual source is found or the monolingual-first rule is amended.
3. 🔲 Blocked: Morphology and transliteration layers are postponed.

## First Safe Task
Add the language metadata config as "unavailable" and document the source blocker.
