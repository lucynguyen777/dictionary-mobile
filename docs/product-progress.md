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
- [ ] TODO [HARD]: Word variations/morphology search (Tìm kiếm theo dạng từ, VD: "went" -> "go").
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
- [x] DONE: Reader settings: font size, font family, background color.
- [x] DONE: Tap word to lookup.
- [x] DONE: Tap word to save and quick note in reading flow.
- [ ] TODO [HARD]: Import EPUB/PDF/DOCX/HTML, starting with the safest format.
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
- [ ] TODO [MEDIUM]: App lock or biometric lock option if native support is added.
- [!] BLOCKED [HARD]: Email login/auth requires choosing an auth provider.
- [!] BLOCKED [HARD]: Cloud sync and encrypted backup require backend/auth decisions.
- [!] BLOCKED [HARD]: Account deletion workflow requires real accounts and backend support.

## Advanced Features

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
1. `[ ] [MEDIUM]` App lock or biometric lock option if native support is added.
2. `[ ] [HARD]` Word variations/morphology search (VD: `went` -> `go`).
3. `[ ] [HARD]` Import EPUB/PDF/DOCX/HTML, starting with the safest format.
4. `[!] [HARD]` Decide backend/API options for production multilingual translation and pronunciation scoring.
5. `[!] [HARD]` Google Sheets export with OAuth.

## Rule
Sau khi hoàn thành và đẩy code lên GitHub:
1. Kiểm tra commit/push trên GitHub để đảm bảo các thay đổi code đã được đẩy thành công.
2. Mở `docs/product-progress.md` và cập nhật checklist để phản ánh trạng thái thực tế của code (đánh dấu `[x]`, `[~]`, `[ ]`, hoặc `[!]` tương ứng) — đồng thời thêm ghi chú ngắn kèm commit hash mới vào phần `Current Baseline` nếu cần.
3. Chạy kiểm tra xác minh: `npx tsc --noEmit` và `npx eslint . --no-cache`.
4. Commit (và push) bất kỳ chỉnh sửa nào của file checklist lên GitHub cùng hoặc ngay sau commit code.
5. Sau khi checklist trên GitHub khớp với code thực tế, bắt đầu task tiếp theo trong `Next Work Queue` bằng cách chuyển trạng thái task đó sang `[~] IN PROGRESS` và tiến hành triển khai.
