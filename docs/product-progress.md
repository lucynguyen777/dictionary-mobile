# Dictionary Mobile Product Progress

File này là checklist tiến độ chính của dự án. Sau mỗi bước triển khai, cập nhật trạng thái ở đây sau khi commit.

## Status Legend
- `[x] DONE`: đã triển khai và đã kiểm tra cơ bản.
- `[~] IN PROGRESS`: đang làm hoặc đã có nền nhưng chưa đủ dùng hằng ngày.
- `[ ] TODO`: chưa triển khai.
- `[!] BLOCKED`: cần backend/API/resource hợp pháp hoặc quyết định sản phẩm trước khi làm.

## Difficulty Legend
- `[EASY]`: local UI/state, no backend, no complex file format.
- `[MEDIUM]`: touches shared data flow, import/export, review logic, or multi-screen behavior.
- `[HARD]`: needs backend, auth, external APIs, speech/AI engine, OAuth, or licensed resource decisions.

## Difficulty Overview
- Easy next tasks: profile settings, privacy copy, loading/empty/error polish, UI copy normalization, import validation messages.
- Medium next tasks: custom import field mapping, Anki text-only export, larger idiom dataset, Reader highlights to flashcards.
- Hard next tasks: auth/cloud sync, Google Sheets OAuth, speech scoring, production multilingual translation, AI features.

## Current Baseline
- Latest completed commits:
  - `536b4ad` fix(adapter): restore generic fetch functions for fallback adapter
  - `667e897` feat: expose source-specific dictionaryApi functions; use dedicated endpoints in adapters; update tests
  - `cc9020f` test: add adapter registry tests and register source adapters; add vitest
  - `1c4a0aa` feat: add adapter registry for language adapters
  - `9902674` docs: mark language metadata added
  - `083addb` feat: add language-family metadata to language config
  - `a58278d` chore: normalize UI copy and import messages
  - `0baa208` Document monolingual-first language build rule
  - `3ec1975` Add VI and FR dictionary lookup sources
  - `293174f` Add HTML import for Reader
  - `3706441` Add English morphology lookup fallback
  - `1a07198` Add biometric app lock option
  - `b46a5d2` Support TSV vocabulary import
  - `8764019` Add pronunciation recording playback
  - `2e77772` Expand bilingual domain inference rules
  - `bd96e80` Fix CSV import field mapping flow
  - `4ed73c1` feat(reader): improve highlight behavior to support adjacent multi-word selection
  - `66c5dd0` feat(library): implement SuperMemo-2 (SM-2) algorithm for flashcard spaced repetition
  - `fc1fa77` feat(lookup): add text-to-speech for example sentences using expo-speech
  - `d1f96b5` feat(lookup): add support for rich bilingual example sentences
  - `56dd113` feat(lookup): add spelling suggestions for empty results
  - `72abef2` feat(library): add Anki TSV export button per folder with proper Anki header format
  - `a9cf589` feat(profile): add delete/reset all local data with confirmation alert
  - `9e2d7c3` feat(home): add Word of the Day card with date-based seed selection
  - `770124e` feat(import): auto-select flashcard types based on CSV fields
  - `f58cc37` feat(data): export all local user data + profile UI button
  - `a6f1c79` fix(ui): localize profile, reader, library copy; polish lookup error message
  - `a1958c5` docs: update Next Work Queue and mark Reader highlights done
  - `1f44f37` Add Anki TSV export and UI
  - `c2feab9` Add custom field mapping UI for CSV import
  - `66a8ae4` Expand idioms/phrasal verbs dataset
  - `ff470d7` Improve Reader highlight flow and create flashcards from highlights
  - `de2bdc8` Stabilize deep dictionary lookup
  - `1b77af3` Improve vocabulary import workflow
  - `8455679` Add reader quick save flow
  - `a280c33` Add flashcard review filters
  - `3209bbf` Support advanced vocabulary import options
  - `aa75832` Add Excel folder export
  - `75a0cc3` Add product progress checklist
  - `cf6910e` Track user profile and privacy roadmap
  - `70bfe3c` Add local profile settings
  - `7a0e074` Show local profile data overview
  - `3d29779` Improve vocabulary import validation
  - `30cb448` Standardize lookup tab states
- Verification habit before code commits:
  - `npx tsc --noEmit`
  - `npx eslint . --no-cache`

## Core Features

### UI & Copy Polish
- [x] DONE [EASY]: Localized small UI strings and polished lookup error presentation (commit `a6f1c79`).


### Dictionary Lookup
- [x] DONE [MEDIUM]: English-English monolingual lookup with definitions.
- [x] DONE [EASY]: IPA display and audio sample playback.
- [x] DONE [MEDIUM]: English-Vietnamese bilingual dictionary lookup.
- [x] DONE [EASY]: Meaning grouped by word type.
- [x] DONE [MEDIUM]: Meaning domain/context shown only when available or reasonably inferred.
- [x] DONE [MEDIUM]: Expand domain/context extraction for common polysemous words beyond `cell` (commit `2e77772`).
- [x] DONE [EASY]: Standardize loading, empty, and error states across all lookup tabs.
- [x] DONE [EASY]: Normalize mixed Vietnamese/English UI copy.
- [x] DONE [EASY]: Search History / Recent searches (Lịch sử tìm kiếm).
- [x] DONE [MEDIUM]: Spelling suggestions / "Did you mean?" (Gợi ý lỗi chính tả) (commit `56dd113`).
- [x] DONE [HARD]: Word variations/morphology search for English inflections and common irregular forms (VD: "went" -> "go") (commit `3706441`).
- [ ] TODO [HARD]: Offline dictionary database bundle (Bộ dữ liệu từ điển offline hoàn chỉnh).
- [ ] TODO [HARD]: Voice Search / OCR Camera Lookup (Tìm kiếm bằng giọng nói / Dịch qua hình ảnh).

### Context & Examples
- [x] DONE [MEDIUM]: Rich example sentences for definitions (Câu ví dụ chi tiết cho từng nghĩa, có dịch song ngữ) (commit `d1f96b5`).
- [x] DONE [MEDIUM]: Text-to-speech (TTS) for example sentences (Đọc câu ví dụ) (commit `fc1fa77`).
- [x] DONE [EASY]: Word of the Day / Daily Vocabulary (Từ vựng mỗi ngày).

### Lexical Relations
- [x] DONE: Synonyms/Antonyms from API with local fallback.
- [x] DONE: Synonym/antonym backlink to lookup route.
- [x] DONE: Local idioms/phrasal verbs text-only preview.
- [x] DONE: Phrase backlink to lookup route.
- [x] DONE [MEDIUM]: Expand idioms/phrasal verbs dataset and classification (commit `66a8ae4`).

### Library And Saved Words
- [x] DONE: Save words to folder.
- [x] DONE: Favorites and notes for saved words.
- [x] DONE: Local-first Library with folder list and detail.
- [x] DONE: Create, rename, delete folders.
- [x] DONE: Remove word from folder.
- [x] DONE: Search/filter folders and saved words.
- [x] DONE: Export folder to CSV.
- [x] DONE [MEDIUM]: Export folder to Excel-compatible `.xls`.
- [x] DONE [MEDIUM]: Anki text-only export from folder/saved words (commit `72abef2`).
- [!] BLOCKED [HARD]: Google Sheets export, requires OAuth and Google API flow.

### Pronunciation
- [x] DONE: Audio-only pronunciation in lookup.
- [x] DONE [MEDIUM]: Record user pronunciation (commit `8764019`).
- [!] BLOCKED [HARD]: IPA comparison with per-phoneme alignment and scoring needs speech/phoneme engine or backend.
- [!] BLOCKED [HARD]: Phoneme-level scoring table needs reliable alignment engine.
- [!] BLOCKED [HARD]: GIF/visual pronunciation guidance needs content production pipeline.

## Learning Tools

### Flashcards
- [x] DONE: Flashcard MVP from saved words.
- [x] DONE: Card type checklist: bilingual, word-definition, definition-word, word-pronunciation.
- [x] DONE: Local review state: `new`, `learning`, `reviewed`.
- [x] DONE: Flashcard filters by folder, card type, and review state.
- [x] DONE: Create flashcards after CSV import.
- [x] DONE: Polish flashcard creation from imported datasets.
- [x] DONE: Prepare Anki text-only export from flashcards.
- [x] DONE [MEDIUM]: Add richer review scheduling after local MVP is stable (commit `66c5dd0`).

### Import Dataset
- [x] DONE: CSV import MVP.
- [x] DONE: Basic field mapping by recognized headers: `word`, `definition`, `ipa`, `note`, `tags`.
- [x] DONE: Import into new folder.
- [x] DONE: Import into existing folder.
- [x] DONE: Preview before import.
- [x] DONE: Advanced import options: row/column orientation, header on/off, primary key.
- [x] DONE: Validate duplicates and empty data more clearly in the UI.
- [x] DONE [MEDIUM]: User-controlled custom field mapping beyond recognized headers/order (commits `c2feab9`, `bd96e80`).
- [x] DONE [MEDIUM]: Import non-CSV datasets if needed (TSV support, commit `b46a5d2`).

### Reader
- [x] DONE: TXT reader MVP.
- [x] DONE [MEDIUM]: HTML Reader import with local text extraction (commit `293174f`).
- [x] DONE: Reader settings: font size, font family, background color.
- [x] DONE: Tap word to lookup.
- [x] DONE: Tap word to save and quick note in reading flow.
- [~] IN PROGRESS [HARD]: Import EPUB/PDF/DOCX after HTML; needs format-specific parser decisions.
- [x] DONE [MEDIUM]: Better text selection/highlight behavior beyond tap-token flow (commit `4ed73c1`).
- [x] DONE: Create flashcards directly from Reader highlights.

## User Profile And Privacy

### Basic Profile
- [x] DONE [EASY]: Profile tab UI exists and now uses local editable data.
- [x] DONE [EASY]: Editable display name.
- [x] DONE [EASY]: Email and login method display.
- [x] DONE [EASY]: Native language setting.
- [x] DONE [EASY]: Learning language setting, including multiple target languages later.
- [x] DONE [EASY]: Current proficiency level setting from A1 to C2.
- [x] DONE [EASY]: Learning goal setting, for example exam, travel, academic, work, daily communication.
- [x] DONE [EASY]: Timezone setting.
- [x] DONE [EASY]: Daily goal setting, for example words/day, minutes/day, reviews/day.
- [x] DONE [EASY]: Persist profile settings locally before cloud/auth is chosen.

### Data Privacy And Security
- [x] DONE [EASY]: Local data overview showing saved words, folders, flashcards, reader files, and import datasets.
  - [x] DONE [MEDIUM]: Export all local user data.
- [x] DONE [MEDIUM]: Delete/reset local user data with confirmation (commit `a9cf589`).
- [x] DONE [EASY]: Privacy copy explaining local-first storage and what leaves the device.
- [x] DONE [MEDIUM]: App lock or biometric lock option if native support is added (commit `1a07198`).
- [!] BLOCKED [HARD]: Email login/auth requires choosing an auth provider.
- [!] BLOCKED [HARD]: Cloud sync and encrypted backup require backend/auth decisions.
- [!] BLOCKED [HARD]: Account deletion workflow requires real accounts and backend support.

## Advanced Features

### Multilingual Dictionary Expansion
- [x] DONE [MEDIUM]: VI-VI dictionary via MinhQnd API with suggestions and relations (commit `3ec1975`).
- [x] DONE [MEDIUM]: FR-FR dictionary via hybrid local/Wiktapi source (commit `3ec1975`).
- [!] BLOCKED [HARD]: VI↔FR bilingual dictionary source selection; do not use machine translation as dictionary data.

### Language Family Roadmap
- [x] DONE [MEDIUM]: Austroasiatic baseline: Vietnamese (VI-VI) with dictionary API, suggestions, relations, tone/diacritic-sensitive display.
- [x] DONE [MEDIUM]: Indo-European baseline: English and French with monolingual lookup, IPA/audio when available, gender for French when source provides it.
- [x] DONE [MEDIUM]: Add language-family metadata to language config before adding more languages: `family`, `script`, `writingDirection`, `adapterKey`, `dictionaryStatus` (commit `083addb`).
- [x] DONE [MEDIUM]: Build adapter registry by language pair/family so each new language declares source, morphology strategy, romanization, and blocked states (commits `1c4a0aa`, `cc9020f`, `667e897`, `536b4ad`).
- [ ] TODO [MEDIUM]: Indo-European next-build candidates: Spanish, Hindi, Russian.
  - Spanish: Latin script, gender, conjugation, easier after French.
  - Russian: Cyrillic, case, gender, aspect, morphology fallback required.
  - Hindi: Devanagari, gender, transliteration, postpositions.
- [ ] TODO [HARD]: Sino-Tibetan next-build candidates: Mandarin, Cantonese, Burmese, Tibetan.
  - Mandarin: Hanzi, pinyin, tones, segmentation, classifiers.
  - Cantonese: Hanzi, jyutping, tones, traditional/simplified variants.
  - Burmese/Tibetan: script-specific segmentation and source selection required.
- [ ] TODO [HARD]: Afro-Asiatic next-build candidates: Arabic, Hebrew, Amharic, Somali.
  - Arabic/Hebrew: RTL UI, abjad script, root-pattern morphology, diacritics.
  - Amharic: Ge'ez script and transliteration.
  - Somali: Latin script but needs morphology/source research.
- [ ] TODO [MEDIUM]: Niger-Congo next-build candidates: Swahili, Yoruba, Zulu, Igbo.
  - Swahili/Zulu: noun classes and prefixes.
  - Yoruba/Igbo: tone and diacritic-safe search.
- [ ] TODO [MEDIUM]: Austronesian next-build candidates: Tagalog, Javanese, Malay, Hawaiian.
  - Malay: easiest candidate, Latin script, relatively light inflection.
  - Tagalog: focus/voice system and affix-heavy morphology.
  - Javanese/Hawaiian: register or diacritic-sensitive search.
- [ ] TODO [HARD]: Dravidian next-build candidates: Tamil, Telugu, Kannada, Malayalam.
  - Requires native script support, transliteration, agglutinative morphology, lemma fallback.
- [ ] TODO [HARD]: Turkic next-build candidates: Turkish, Uzbek, Kazakh, Uyghur.
  - Turkish first: agglutinative suffixes, vowel harmony, case/morphology search.
  - Uzbek/Kazakh/Uyghur need script-specific source strategy.
- [ ] TODO [HARD]: Uralic next-build candidates: Finnish, Hungarian, Estonian.
  - Case-rich morphology and lemmatization are required before production lookup.
- [ ] TODO [HARD]: Japanese/Korean build track.
  - Japanese: kana/kanji, romaji, tokenizer, pitch accent if source supports it.
  - Korean: Hangul, romanization, particles, verb/adjective endings; treat as Korean-specific, not dependent on disputed Altaic grouping.
- [!] BLOCKED [HARD]: Amerind/proposed-family candidates: Quechua, Nahuatl, Guarani.
  - Do not treat Amerind as a production taxonomy; choose each language only after source/license research.
- [!] BLOCKED [HARD]: Isolate-language candidates: Basque, Ainu, Korean if modeled as isolate.
  - Basque can be researched after Indo-European Latin-script pipeline; Ainu is blocked until source availability is proven.

### Translation
- [~] IN PROGRESS [MEDIUM]: Language selector and bilingual English-Vietnamese dictionary flow.
- [!] BLOCKED [HARD]: Production multilingual translation for many language pairs needs selected API/backend.
- [!] BLOCKED [HARD]: Specialized translation with user glossary/database needs backend, auth, and cost controls.

### Etymology And Conjugation
- [ ] TODO [HARD]: Choose legal structured resource for etymology.
- [ ] TODO [HARD]: Choose reliable resource for conjugation.
- [!] BLOCKED [HARD]: Production etymology and conjugation should not be mocked without a real resource.

### AI
- [!] BLOCKED [HARD]: Real-time voice/text chatbot needs backend, streaming, auth, and cost controls.
- [!] BLOCKED [HARD]: Specialized document translation with imported glossary needs backend and persistence strategy.

## Next Work Queue
1. `[!] [HARD]` VI↔FR bilingual dictionary source selection.
2. `[~] [HARD]` Import EPUB/PDF/DOCX after HTML; needs format-specific parser decisions.
3. `[!] [HARD]` Decide backend/API options for production multilingual translation and pronunciation scoring.
4. `[!] [HARD]` Google Sheets export with OAuth.

## Rule
Sau khi hoàn thành và đẩy code lên GitHub:
1. Kiểm tra commit/push trên GitHub để đảm bảo các thay đổi code đã được đẩy thành công.
2. Mở `docs/product-progress.md` và cập nhật checklist để phản ánh trạng thái thực tế của code (đánh dấu `[x]`, `[~]`, `[ ]`, hoặc `[!]` tương ứng) — đồng thời thêm ghi chú ngắn kèm commit hash mới vào phần `Current Baseline` nếu cần.
3. Chạy kiểm tra xác minh: `npx tsc --noEmit` và `npx eslint . --no-cache`.
4. Commit (và push) bất kỳ chỉnh sửa nào của file checklist lên GitHub cùng hoặc ngay sau commit code.
5. Sau khi checklist trên GitHub khớp với code thực tế, bắt đầu task tiếp theo trong `Next Work Queue` bằng cách chuyển trạng thái task đó sang `[~] IN PROGRESS` và tiến hành triển khai.
6. Trước khi build một ngôn ngữ mới, xác định language family/typology của ngôn ngữ đó và ghi vào `Language Family Roadmap`.
7. Nếu family/typology đó đã có ngôn ngữ được build trong hệ thống, so sánh ngôn ngữ mới với các baseline đã build trong cùng family trước: script, writing direction, segmentation, morphology, pronunciation/IPA, romanization, gender/case/tone/classifier/noun class, dictionary source, và UI/search implications.
8. Nếu family/typology đó chưa có ngôn ngữ nào được build, research và phân tích đặc điểm ngôn ngữ trước để tạo baseline đầu tiên cho family đó, rồi mới lập plan implement.
9. Khi build một ngôn ngữ mới, luôn build từ điển tra cứu trong cùng ngôn ngữ trước (monolingual: `lang -> lang`) với definition, part of speech, pronunciation/IPA/audio nếu có, và các field đặc thù của ngôn ngữ đó. Chỉ sau khi monolingual lookup ổn mới mở bilingual dictionary từ/ngôn ngữ đó sang các ngôn ngữ đã build trong hệ thống.
10. Bilingual dictionary giữa hai ngôn ngữ phải dùng nguồn dictionary/lexical source đáng tin; không dùng machine translation để giả lập definition từ điển.
11. Với các nhóm gây tranh luận như Altaic hoặc Amerind, chỉ dùng như bucket kỹ thuật/roadmap; không coi là taxonomy production khi thiết kế dữ liệu.
