# Current Product State

## Completed Areas

### Dictionary Lookup
- English monolingual lookup (definitions, IPA, audio, morphology fallback)
- English-Vietnamese bilingual lookup
- Vietnamese monolingual lookup
- French monolingual lookup (Wiktionary preview)
- French-Vietnamese bilingual lookup
- Spanish monolingual lookup (WiktAPI adapter, morphology, gender labels)
- Malay monolingual lookup (WiktAPI adapter, affix/reduplication morphology)
- Russian monolingual lookup (ruwiktionary CC BY-SA, Cyrillic case/aspect morphology fallbacks)
- Swahili monolingual lookup (swwiktionary CC BY-SA, noun class plural-to-singular, verb prefix stripping)
- Yoruba monolingual lookup (CC BY-SA, tone-insensitive lookup, morphology fallbacks)
- Zulu monolingual lookup (CC BY-SA, noun class prefix & locative fallbacks)
- Igbo monolingual lookup (local educational fixtures, tone-insensitive underdot-preserving lookup)
- Hawaiian monolingual lookup (ʻokina normalization, kahakō-aware lookup)
- Mandarin monolingual lookup (zhwiktionary CC BY-SA, Intl.Segmenter word segmentation)
- Burmese monolingual lookup (CC BY-SA, script tokenization fallback)
- Tibetan monolingual lookup (CC BY-SA, tokenization fallback, local fixtures)
- Arabic monolingual lookup (arwiktionary CC BY-SA, RTL UI support, diacritic handling, root-pattern morphology)
- Hebrew monolingual lookup (hewiktionary CC BY-SA, RTL UI support, diacritic handling, morphology lookup)
- Amharic monolingual lookup (amwiktionary CC BY-SA, abugida vowel/order shift mapping morphology)
- Somali monolingual lookup (CC BY-SA, definite article morphology fallbacks)
- Tagalog monolingual lookup (tlwiktionary CC BY-SA, focus trigger & reduplication/infixation fallbacks)
- Javanese monolingual lookup (CC BY-SA, active/passive morphology fallbacks)
- Tamil monolingual lookup (agglutinative nominal/verbal oblique suffix morphology fallbacks)
- Telugu monolingual lookup (agglutinative suffix morphology fallbacks)
- Kannada monolingual lookup (agglutinative suffix morphology fallbacks)
- Malayalam monolingual lookup (agglutinative suffix morphology fallbacks)
- Turkish monolingual lookup (dotless/dotted I casing, case-suffix stripping morphology, suffix chains)
- Finnish monolingual lookup (fiwiktionary CC BY-SA, case-gradation morphology fallback rules)
- Hungarian monolingual lookup (huwiktionary CC BY-SA, exact Latin, vowel harmony plural/case fallbacks, verb conjugation fallback)
- IPA display and audio sample playback
- Example sentence TTS (expo-speech)
- Spelling suggestions / "Did you mean?" for empty results
- Synonyms, antonyms, idioms, phrasal verbs (expanded dataset and classification, backlinks to lookup)
- Etymology adapter integration slice (Wiktionary-derived attribution UI and missing-source fallback)

### Library
- Save words to folders
- Favorites and notes
- Create, rename, delete folders (rename flow in kebab menu, creative plus button sheet)
- Folder search/filter
- Folder sorting (newest, oldest, A-Z, Z-A, most words, least words, favorites first)
- Folder view modes (icon toggles for list/grid, compact removed)
- Folder favorite metadata (visual state isolated from word favorites)
- Duplicate folder action (copies metadata and word membership safely without saved-word duplicates)
- Folder color picker and persistent color metadata with color rule notes
- CSV, Excel-compatible XLS, and Anki TSV export (moved to Kebab Download menu)
- Folder share action using local share/export paths
- Layout fixed FAB and sheet menus to prevent overlaps on mobile and Expo web

### Flashcards
- Flashcards from saved words
- Card type checklist (bilingual, word-definition, definition-word, word-pronunciation)
- Review states (new, learning, reviewed)
- Review filters (by folder, card type, review state)
- SuperMemo-2 (SM-2) spaced repetition algorithm
- Flashcards from imported datasets
- Flashcards from Reader highlights
- Offline sync state management (version, syncStatus tracker, and background sync preparation)

### Reader
- TXT reader
- HTML reader
- Font and background settings
- Tap word to lookup/save (quick save flow in reading flow)
- Highlight flow (adjacent multi-word selection and highlight highlights)
- Flashcards from highlights
- Structured imports hardened with file-size (10MB limit) and empty-text limits
- PDF.js-style extraction parser prototype covering digital, empty, and scanned-image PDFs
- PDF Reader import enabled under `READER_ENABLE_PDF=true` gate for Expo web (with unsupported alerts on native/Expo Go)

### Profile & Privacy
- Local profile settings
- Settings sidebar / drawer overlay (avatar, display name, username, email/phone/password placeholders)
- Native language and multiple learning languages
- Proficiency level (A1 to C2) and learning goals
- Timezone and Daily goal settings (words, minutes, reviews)
- Local data overview showing count of saved words, folders, flashcards, reader files, and datasets
- Export all local user data and reset/delete all local data with confirmation alert
- Biometric app lock (expo-local-authentication) and database backup confirmation.
- Local user-data SQLite runtime for Profile, Library, and Reader, with migration from legacy AsyncStorage and explicit legacy cleanup utility.

### Auth & Cloud Sync
- Supabase Authentication (email registration, login, secure token management via SecureStore, and session refresh callbacks).
- Realtime database sync runner synchronization for user profiles, library folders, saved words, word memberships, search history, and flashcards.
- Soft-deleted record tracking with tombstones and cursor-based sync polling.

### AI Assistant & Translation Proxy
- Backend API proxy executing requests with Supabase auth session token headers.
- DeepL text translation panel embedded in dictionary word lookups and Reader selection cards.
- AI Tutor assistant (`ai-assistant`) conversational dashboard supporting writing correction, conversation practice, grammar explanations, and scenario roleplays via OpenAI backend proxy.
- Monthly/daily usage quotas and event logging tracking character counts.

## In Progress
- Post-release optimization and monitoring.

## Blocked
- Google Sheets export (OAuth flow and Google API blocked)
- Speech scoring (IPA comparison, per-phoneme scoring alignment engine)
- Cantonese monolingual baseline (needs words.hk hosted API or approved local bundle path)
- Uyghur monolingual baseline (needs enough balanced non-placeholder native-definition fixtures or another approved source)
- VI-to-FR bilingual dictionary source selection (no machine translation allowed)
- Production conjugation and real etymology resource paths (UniMorph/Kaikki CC-BY-SA integration blocked until licensed offline strategy selected)
