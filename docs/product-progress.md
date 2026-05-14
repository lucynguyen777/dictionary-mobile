# Dictionary Mobile Product Progress

File này là checklist tiến độ chính của dự án. Sau mỗi bước triển khai, cập nhật trạng thái ở đây trước khi commit.

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
  - `de2bdc8` Stabilize deep dictionary lookup
  - `1b77af3` Improve vocabulary import workflow
  - `8455679` Add reader quick save flow
  - `a280c33` Add flashcard review filters
  - `3209bbf` Support advanced vocabulary import options
  - `aa75832` Add Excel folder export
  - `75a0cc3` Add product progress checklist
  - `cf6910e` Track user profile and privacy roadmap
  - `70bfe3c` Add local profile settings
- Verification habit before code commits:
  - `npx tsc --noEmit`
  - `npx eslint . --no-cache`

## Core Features

### Dictionary Lookup
- [x] DONE [MEDIUM]: English-English monolingual lookup with definitions.
- [x] DONE [EASY]: IPA display and audio sample playback.
- [x] DONE [MEDIUM]: English-Vietnamese bilingual dictionary lookup.
- [x] DONE [EASY]: Meaning grouped by word type.
- [x] DONE [MEDIUM]: Meaning domain/context shown only when available or reasonably inferred.
- [~] IN PROGRESS [MEDIUM]: Expand domain/context extraction for common polysemous words beyond `cell`.
- [~] IN PROGRESS [EASY]: Standardize loading, empty, and error states across all lookup tabs.
- [~] IN PROGRESS [EASY]: Normalize mixed Vietnamese/English UI copy.

### Lexical Relations
- [x] DONE: Synonyms/Antonyms from API with local fallback.
- [x] DONE: Synonym/antonym backlink to lookup route.
- [x] DONE: Local idioms/phrasal verbs text-only preview.
- [x] DONE: Phrase backlink to lookup route.
- [~] IN PROGRESS: Expand idioms/phrasal verbs dataset and classification.

### Library And Saved Words
- [x] DONE: Save words to folder.
- [x] DONE: Favorites and notes for saved words.
- [x] DONE: Local-first Library with folder list and detail.
- [x] DONE: Create, rename, delete folders.
- [x] DONE: Remove word from folder.
- [x] DONE: Search/filter folders and saved words.
- [x] DONE: Export folder to CSV.
- [x] DONE: Export folder to Excel-compatible `.xls`.
- [ ] TODO: Anki `.apkg` text-only export.
- [!] BLOCKED: Google Sheets export, requires OAuth and Google API flow.

### Pronunciation
- [x] DONE: Audio-only pronunciation in lookup.
- [ ] TODO: Record user pronunciation.
- [!] BLOCKED: IPA comparison with per-phoneme alignment and scoring needs speech/phoneme engine or backend.
- [!] BLOCKED: Phoneme-level scoring table needs reliable alignment engine.
- [!] BLOCKED: GIF/visual pronunciation guidance needs content production pipeline.

## Learning Tools

### Flashcards
- [x] DONE: Flashcard MVP from saved words.
- [x] DONE: Card type checklist: bilingual, word-definition, definition-word, word-pronunciation.
- [x] DONE: Local review state: `new`, `learning`, `reviewed`.
- [x] DONE: Flashcard filters by folder, card type, and review state.
- [x] DONE: Create flashcards after CSV import.
- [~] IN PROGRESS: Polish flashcard creation from imported datasets.
- [ ] TODO: Prepare Anki text-only export from flashcards.
- [ ] TODO: Add richer review scheduling after local MVP is stable.

### Import Dataset
- [x] DONE: CSV import MVP.
- [x] DONE: Basic field mapping by recognized headers: `word`, `definition`, `ipa`, `note`, `tags`.
- [x] DONE: Import into new folder.
- [x] DONE: Import into existing folder.
- [x] DONE: Preview before import.
- [x] DONE: Advanced import options: row/column orientation, header on/off, primary key.
- [~] IN PROGRESS: Validate duplicates and empty data more clearly in the UI.
- [ ] TODO: User-controlled custom field mapping beyond recognized headers/order.
- [ ] TODO: Import non-CSV datasets if needed.

### Reader
- [x] DONE: TXT reader MVP.
- [x] DONE: Reader settings: font size, font family, background color.
- [x] DONE: Tap word to lookup.
- [x] DONE: Tap word to save and quick note in reading flow.
- [ ] TODO: Import EPUB/PDF/DOCX/HTML, starting with the safest format.
- [ ] TODO: Better text selection/highlight behavior beyond tap-token flow.
- [ ] TODO: Create flashcards directly from Reader highlights.

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
- [ ] TODO [MEDIUM]: Export all local user data.
- [ ] TODO [MEDIUM]: Delete/reset local user data with confirmation.
- [x] DONE [EASY]: Privacy copy explaining local-first storage and what leaves the device.
- [ ] TODO [MEDIUM]: App lock or biometric lock option if native support is added.
- [!] BLOCKED [HARD]: Email login/auth requires choosing an auth provider.
- [!] BLOCKED [HARD]: Cloud sync and encrypted backup require backend/auth decisions.
- [!] BLOCKED [HARD]: Account deletion workflow requires real accounts and backend support.

## Advanced Features

### Translation
- [~] IN PROGRESS: Language selector and bilingual English-Vietnamese dictionary flow.
- [!] BLOCKED: Production multilingual translation for many language pairs needs selected API/backend.
- [!] BLOCKED: Specialized translation with user glossary/database needs backend, auth, and cost controls.

### Etymology And Conjugation
- [ ] TODO: Choose legal structured resource for etymology.
- [ ] TODO: Choose reliable resource for conjugation.
- [!] BLOCKED: Production etymology and conjugation should not be mocked without a real resource.

### AI
- [!] BLOCKED: Real-time voice/text chatbot needs backend, streaming, auth, and cost controls.
- [!] BLOCKED: Specialized document translation with imported glossary needs backend and persistence strategy.

## Next Work Queue
1. `[~] [EASY]` Improve validation messages for advanced CSV import.
2. `[~] [EASY]` Standardize loading, empty, and error states across lookup tabs.
3. `[~] [EASY]` Normalize mixed Vietnamese/English UI copy.
4. `[ ] [MEDIUM]` Add custom field mapping UI for import.
5. `[ ] [MEDIUM]` Prepare Anki text-only export from local flashcards.
6. `[ ] [MEDIUM]` Expand idioms/phrasal verbs dataset.
7. `[ ] [MEDIUM]` Improve Reader highlight flow and create flashcards from highlights.
8. `[!] [HARD]` Decide backend/API options for auth, cloud sync, pronunciation scoring, and multilingual translation.

## Update Rule
After finishing a task:
1. Move the relevant item to `[x] DONE`, `[~] IN PROGRESS`, `[ ] TODO`, or `[!] BLOCKED`.
2. Add or update a short note in `Current Baseline` if there is a new important commit.
3. Run verification for code changes.
4. Commit code and this file together when the progress changed because of that code.
