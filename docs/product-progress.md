# Dictionary Mobile Product Progress

File này là checklist tiến độ chính của dự án. Sau mỗi bước triển khai, cập nhật trạng thái ở đây trước commit; nếu cần ghi commit hash mới vào `Current Baseline`, cập nhật bằng commit checklist kế tiếp ngay sau commit code.

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
- Easy next tasks: no active easy task selected; keep future easy work to copy polish and small local UI cleanup.
- Medium next tasks: local UI/data consistency polish and future adapter implementation slices after source smoke tests.
- Hard next tasks: Uyghur planning, Uralic source/status refresh, Niger-Congo source/status refresh, and remaining backend/source-gated work.

## Current Baseline
- Latest completed commits:
  - `efff1f0` feat(lang): add Kazakh monolingual baseline
  - `4705df8` docs(lang): smoke Kazakh source options
  - `54dfd88` feat(recognition): add capture previews
  - `81dac33` feat: add hosted offline pack smoke source
  - `95477d7` feat: prefer ready offline packs in lookup
  - `543b53c` feat: wire offline pack profile actions
  - `1d58d4e` feat: add offline pack download verification
  - `cda92fa` feat: add sqlite offline dictionary storage
  - `ebca0dc` feat: advance recognition and offline roadmap slices
  - `7fb6deb` docs(progress): mark offline dictionary MVP phase 1 done and advance queue
  - `7bfe146` docs(progress): sync baseline commit and set Uzbek planning in queue
  - `dc371a0` docs(lang): add Estonian monolingual baseline plan and advance queue
  - `944baa7` docs(progress): sync completed baseline commits in progress checklist
  - `230fd7a` feat(profile): show offline pack install state
  - `c2e3184` feat(offline): track pack install state
  - `640c9b2` feat(offline): add normalized pack lookup contract
  - `7772343` feat(offline): clarify pack runtime gate
  - `306a898` chore(qa): restore baseline and apply safe audit cleanup
  - `8ed572d` chore(qa): complete app verification workflow
  - `eb5e28a` docs: update project context files and product progress checklist
  - `529105c` docs: sync verification steps and add missing testing guide sections
  - `570b8a8` Add testing infrastructure and update documentation
  - `4b4162b` chore(qa): refine app testing workflow
  - `3e8d2be` feat(offline): add pack status shell
  - `42ecd80` test(offline): cover dictionary pack builder
  - `42c5bd6` feat(offline): prototype dictionary pack planning
  - `a884233` docs(qa): standardize offline-first testing workflow
  - `6db0dfd` feat(qa): add app testing workflow and etymology attribution
  - `b0a645b` feat(lookup): add etymology attribution fallback and sync progress queue
  - `dc8d1ae` docs(lang): add Malayalam baseline plan and advance queue to implementation
  - `a4f5779` docs(progress): sync baseline commit and set Malayalam planning in progress
  - `42e6b61` feat(lang): complete Kannada monolingual baseline and reader script support
  - `b0f5eac` feat(lang): implement Hawaiian monolingual baseline adapter, local educational fixtures, ʻokina normalization, kahakō-aware lookup, and tests
  - `2d0a897` docs(lang): plan Hawaiian monolingual baseline, ʻokina/kahakō normalization, source gates, and fixture-first implementation path
  - `378fae2` feat(lang): implement Igbo monolingual baseline adapter, local educational fixtures, tone-insensitive underdot-preserving lookup, and tests
  - `f3e6b7a` docs(lang): plan Igbo monolingual baseline, source gates, tone/underdot normalization, and fixture-first implementation path
  - `6e8ced6` docs(qa): add centralized testing and build guide, README QA links, and verification rule pointer
  - `60e71e2` feat(lang): implement Zulu monolingual baseline adapter, noun class prefix fallbacks, locative fallback, and local fixture tests
  - `3bff964` docs(lang): plan Zulu monolingual baseline, close completed Yoruba/Korean progress, and refresh Next Work Queue
  - `ee00811` feat(lang): implement Yoruba monolingual baseline adapter, tone-insensitive lookup, local fixtures, and morphology fallbacks
  - `16dee5f` feat(lang): implement Hungarian monolingual baseline adapter, exact Latin search, vowel harmony vowel lengthening plural/case fallbacks, verb conjugation fallback, and local test fixtures
  - `a16cb11` feat(lang): implement Swahili monolingual baseline adapter, exact Latin search, noun class plural-to-singular fallback, verb prefix stripping, and local test fixtures
  - `26423c8` feat(lang): implement Korean monolingual baseline adapter, exact Hangul search, particle stripping, verb inflection fallback, and local test fixtures
  - `f7c0e90` feat(lang): implement Japanese monolingual baseline adapter, exact kana/kanji search, Group 1/2 verb inflection suffix fallback, and local test fixtures
  - `3c74956` feat(lang): implement Turkish monolingual baseline adapter, custom dotless/dotted I casing normalization, case-suffix stripping morphology, and local test fixtures
  - `21875d0` feat(lang): implement Finnish monolingual baseline adapter, local dictionary fixtures, and case-gradation morphology fallback rules
  - `f12afe0` docs(licensing): accept dictionary source licensing policy and unblock monolingual implementations
  - `cd2cb4b` docs(lang): add Tagalog monolingual planning and language option metadata
  - `abfff92` docs(lang): add Cantonese monolingual planning and language option metadata
  - `d1f75e9` feat(lang): integrate Arabic and Hebrew RTL support across lookup, library, and reader
  - `e3bf6ce` feat(ui): keep add actions and scroll top controls accessible
  - `7135233` feat(library): refine folder creation and detail menus
  - `f4ad9e4` feat: gate pdf reader import and sync language plans
  - `772ad60` feat(lang): stabilize bilingual dictionary routing
  - `e9c6e82` feat(flashcards): implement offline sync state management
  - `6f40044` docs(lang): plan Mandarin monolingual baseline and document blocked status
  - `cdf245b` docs(lang): plan Hindi monolingual baseline and document blocked status
  - `68de9fd` feat(reader): harden structured imports with file size and empty text limits
  - `b9e92cb` docs(lang): plan Swahili monolingual baseline and document blocked status
  - `46bd89e` feat(lang): add Malay monolingual baseline with WiktAPI adapter
  - `b2fe0cd` feat(lang): add Spanish monolingual baseline with WiktAPI adapter
  - `43e999e` docs: update epub prototype baseline
  - `f502322` feat(reader): prototype epub import
  - `591c1eb` feat(reader): prototype docx import
  - `acc5df1` docs(reader): select structured import strategy
  - `f8d4b7c` feat(profile): polish export and settings flows
  - `5e2ea50` docs: mark privacy, support, and sign-out sidebar items done
  - `c97f011` feat(profile): add privacy and support sections in settings sidebar
  - `f6b5855` docs: update baseline after profile and training UI shells
  - `ebbf93f` feat(profile,advanced): settings sidebar and training tool UI shells
  - `0ecb3c9` fix(library): prevent toolbar, menu, and FAB overlap on mobile and web
  - `3e441ba` feat(library): add folder share action with format picker
  - `2636f15` Add folder favorite metadata
  - `b5fa8cc` Update progress after library controls
  - `5afb932` Polish library folder controls
  - `b524692` Polish meaning context and training tabs
  - `1651d83` Guard unsupported Reader document imports
  - `8b2770d` Enable French to Vietnamese dictionary lookup
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
  - `git diff --check`
  - `npx tsc --noEmit`
  - `npm run lint`
  - `npm test -- --run` (when shared behavior, parser, adapter, or store changed)

## Core Features

### UI & Copy Polish
- [x] DONE [EASY]: Localized small UI strings and polished lookup error presentation (commit `a6f1c79`).
- [x] DONE [EASY]: Add bottom-right scroll-to-top controls on long lookup and folder pages.


### Dictionary Lookup
- [x] DONE [MEDIUM]: English-English monolingual lookup with definitions.
- [x] DONE [EASY]: IPA display and audio sample playback.
- [x] DONE [MEDIUM]: English-Vietnamese bilingual dictionary lookup.
- [x] DONE [EASY]: Meaning grouped by word type.
- [x] DONE [MEDIUM]: Meaning domain/context shown only when available or reasonably inferred.
- [x] DONE [MEDIUM]: Meaning context/domain chips always normalize to a dedicated tag; missing API tags display `Nghĩa chung` instead of disappearing or mixing into definitions (commit `b524692`).
- [x] DONE [MEDIUM]: Expand domain/context extraction for common polysemous words beyond `cell` (commit `2e77772`).
- [x] DONE [EASY]: Standardize loading, empty, and error states across all lookup tabs.
- [x] DONE [EASY]: Normalize mixed Vietnamese/English UI copy.
- [x] DONE [EASY]: Search History / Recent searches (Lịch sử tìm kiếm).
- [x] DONE [MEDIUM]: Spelling suggestions / "Did you mean?" (Gợi ý lỗi chính tả) (commit `56dd113`).
- [x] DONE [HARD]: Word variations/morphology search for English inflections and common irregular forms (VD: "went" -> "go") (commit `3706441`).
- [x] DONE [HARD]: Offline dictionary database bundle planning and decision accepted in `.docs/decisions/offline-dictionary-bundle.md` (Option 1: Wiktionary/Kaikki bundles with staged implementation).
- [~] IN PROGRESS [HARD]: Voice Search / OCR Camera Lookup (Tìm kiếm bằng giọng nói / Dịch qua hình ảnh).
  - [x] DONE [HARD]: Architecture/library evaluation and staged implementation plan: `docs/voice-ocr-plan.md`.
  - [x] DONE [HARD]: Implementation Phase 1: Word screen Voice/OCR entry points, microphone/photo-library permission flow, local audio/image capture hooks, deterministic STT/OCR prototype results, and lookup routing covered by `tests/recognition.test.ts`.
  - [x] DONE [HARD]: Implementation Phase 2: capture previews for local audio/image inputs, OCR camera preview entry, manual dev-client smoke matrix, and on-device OCR/STT engine shortlist documented in `docs/voice-ocr-plan.md`.

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

### Library Folder UI/UX
- [x] DONE [EASY]: Replace visible per-folder export tags (`CSV`, `XLS`, `Anki`) with a kebab menu button on each folder card.
- [x] DONE [EASY]: Keep the create-folder plus button fixed just above the bottom tab bar so it does not move while the folder list scrolls.
- [x] DONE [EASY]: Add common folder sort options under the left control below search: newest, oldest, A-Z, Z-A, most words, least words, favorites first.
- [x] DONE [EASY]: Add folder view mode control under the right control below search: grid, list, compact.
- [x] DONE [MEDIUM]: Build the folder kebab menu/action sheet with grouped actions: favorite, duplicate, color, rename, download, share.
- [x] DONE [MEDIUM]: Move existing CSV, XLS, and Anki export actions into the kebab menu `Download` section.
- [x] DONE [MEDIUM]: Add folder favorite metadata and visual state without confusing it with saved-word favorites.
- [x] DONE [MEDIUM]: Add duplicate folder action that copies folder metadata and word membership safely without duplicating saved word records unnecessarily.
  - [x] DONE [MEDIUM]: Add color picker for folders and persist color metadata locally.
  - [x] DONE [MEDIUM]: Add user-defined color rule notes for each folder color so users can assign their own meaning to colors.
  - [x] DONE [MEDIUM]: Reuse or polish rename flow from the kebab menu.
- [x] DONE [MEDIUM]: Add share action for folders using available local share/export paths; keep unsupported platforms graceful.
- [x] DONE [MEDIUM]: Ensure search, sort, view mode, kebab menu, and fixed plus button work on mobile and Expo web without overlap.
- [x] DONE [MEDIUM]: Move create-folder and CSV/TSV import entry points into the fixed plus button sheet with create/upload choices, rename support, and folder metadata editing for color, tags, and avatar URL, without keeping the form at the top of the folder list.
- [x] DONE [MEDIUM]: Simplify folder view modes to direct grid/list icon toggles and remove the compact text button.
- [x] DONE [MEDIUM]: Move folder detail export and settings actions into a top-right kebab menu, and align the folder image/avatar beside the folder name.

### Pronunciation
- [x] DONE: Audio-only pronunciation in lookup.
- [x] DONE [MEDIUM]: Record user pronunciation (commit `8764019`).
- [!] BLOCKED [HARD]: IPA comparison with per-phoneme alignment and scoring needs speech/phoneme engine or backend.
- [!] BLOCKED [HARD]: Phoneme-level scoring table needs reliable alignment engine.
- [!] BLOCKED [HARD]: GIF/visual pronunciation guidance needs content production pipeline.

## Learning Tools

### Training Tools UI/UX
- [x] DONE [MEDIUM]: Collapse Advanced/Luyện tập into selectable tool tabs instead of showing Flashcard local as one large default block (commit `b524692`).
- [x] DONE [MEDIUM]: Add frontend shell panels for AI hội thoại, Dịch chuyên ngành, Import, Reader, Export, and Flashcard local with per-tool status/roadmap copy (commit `b524692`).
- [x] DONE [MEDIUM]: Build AI hội thoại frontend tab: chat list, realtime chat surface, voice recording state, transcript area, correction/feedback panel, empty/loading/error states.
- [x] DONE [MEDIUM]: Build Dịch chuyên ngành frontend tab: domain/topic selector, glossary import/paste surface, source text editor, translated output panel, terminology highlights, blocked backend notice.
- [x] DONE [MEDIUM]: Build Import frontend tab polish: dataset source chooser, mapping preview, validation summary, destination folder chooser, flashcard generation checklist.
- [x] DONE [MEDIUM]: Build Export frontend tab polish: CSV/Excel/Anki text actions, blocked Google Sheets state, export history/status feedback.
- [x] DONE [MEDIUM]: Move each Training/Luyện tập tool into a list-to-detail flow so tool content opens on its own page with a back affordance.

### Flashcards
- [x] DONE: Flashcard MVP from saved words.
- [x] DONE: Card type checklist: bilingual, word-definition, definition-word, word-pronunciation.
- [x] DONE: Local review state: `new`, `learning`, `reviewed`.
- [x] DONE: Flashcard filters by folder, card type, and review state.
- [x] DONE: Create flashcards after CSV import.
- [x] DONE: Polish flashcard creation from imported datasets.
- [x] DONE: Prepare Anki text-only export from flashcards.
- [x] DONE [MEDIUM]: Add richer review scheduling after local MVP is stable (commit `66c5dd0`).
- [x] DONE [HARD]: Implement offline sync state management for Flashcards: track version, syncStatus (pending_create, pending_update, pending_delete), and lastSyncedAt for background sync.

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
- [x] DONE [HARD]: Import EPUB/PDF/DOCX after HTML; DOCX Mammoth-to-HTML, EPUB spine/chapter, and PDF.js-style extraction are fully integrated and verified via unit tests and browser smoke tests.
- [x] DONE [MEDIUM]: Better text selection/highlight behavior beyond tap-token flow (commit `4ed73c1`).
- [x] DONE: Create flashcards directly from Reader highlights.
- [x] DONE [HARD]: Harden Reader structured imports: add file-size (10MB limit) and empty-text limits.
- [x] DONE [HARD]: Reader PDF extraction fixture gate: dev-client/web fixture expectations are documented and PDF remains disabled until a digital PDF test path is verified.
- [x] DONE [HARD]: Reader PDF extraction implementation preparation: repo-owned digital/empty/image-only fixtures are committed, parser path is selected as web-first PDF.js-style prototype before native dev-client evaluation, and PDF remains disabled.
- [x] DONE [HARD]: Reader PDF extraction parser prototype: PDF.js-style parser abstraction and fixture tests cover digital, empty, and image-only PDFs while app PDF import remains disabled.
- [x] DONE [HARD]: Reader PDF import enablement gate. Wire PDF into Reader import under the `READER_ENABLE_PDF=true` gate for Expo web, verify unsupported native/Expo Go alerts, and execute manual browser smoke testing.

## User Profile And Privacy

### Profile Settings Sidebar
- [x] DONE [EASY]: Turn the top-left profile hamburger icon into a real settings button with clear press feedback.
- [x] DONE [MEDIUM]: Build a profile settings sidebar/drawer overlay with close button, backdrop press, safe-area spacing, and scroll support.
- [x] DONE [MEDIUM]: Add Account/Profile settings panel: avatar UI, display name, username, email, phone number, password placeholder, and delete account action.
- [ ] TODO [HARD]: Real password/email/phone verification changes require auth provider selection; keep UI clearly marked as local/coming soon until auth exists.
- [x] DONE [MEDIUM]: Persist notification preferences locally until cloud sync/auth is selected.
- [x] DONE [EASY]: Add Privacy settings sidebar item that links to local-first privacy copy, app lock, data export, and local data reset.
- [x] DONE [EASY]: Add Support settings items: Help center and Feedback.
- [ ] TODO [HARD]: Feedback submission to backend/email/helpdesk is blocked until support channel is selected.
- [x] DONE [EASY]: Add Sign out action with disabled/coming-soon state when there is no authenticated session.
- [x] DONE [EASY]: Add bottom legal links: Terms, Privacy Policy, Acknowledgements.
- [x] DONE [MEDIUM]: Polish sidebar UI/UX for mobile and web: compact rows, icons, section headers, destructive action styling, no text overflow.

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

### Dictionary Data Tooling
- [x] DONE [MEDIUM]: Schedule bulk crawl and import for headword batches: `scripts/wiktionary-bulk.mjs`, `scripts/wiktionary-client.mjs`, sample headword list, `.gitignore`, and `docs/cache-and-fixtures.md` support resumable crawls with ignored cache/log output. Verification: `node scripts/wiktionary-bulk.mjs --file data/headword-lists/sample-headwords.txt --batch-size 3 --concurrency 2 --delay-between-batches 1 --delay-ms 1 --resume` skipped 6 existing cached sample entries with 0 errors.
- [x] DONE [MEDIUM]: Add centralized QA, unit test, build/run, manual smoke, and release checklist documentation in `docs/testing-and-build-guide.md`; update README and agent verification rules.
- [x] DONE [MEDIUM]: Set up Playwright Expo Web UI artifact testing with Word Detail smoke coverage, npm E2E scripts, ignored artifact output, and a Maestro native flow template requiring `MAESTRO_APP_ID`.
- [x] DONE [MEDIUM]: Complete QA development workflow: GitHub Actions verify/E2E jobs, reusable Playwright artifact helper, Profile offline-pack E2E coverage, Expo Go Maestro scripts, Expo patch-version alignment, and pointerEvents warning cleanup.
- [x] DONE [EASY]: Run safe dependency audit cleanup without `--force`, including a narrow `brace-expansion` override for ESLint's `minimatch` path; remaining moderate audit findings require planned Expo SDK 55 and Vitest 4 upgrade tasks.
- [x] DONE [EASY]: Polish offline pack size labels so exact estimates render as a single value, covered by focused offline pack tests.
- [x] DONE [EASY]: Add an explicit offline-pack runtime gate so Profile and tests show when pack download/import is blocked by missing SQLite runtime management.
- [x] DONE [MEDIUM]: Add offline normalized entry lookup contract with exact lookup, morphology fallback, missing-result behavior, related words, and API-result mapping coverage.
- [x] DONE [MEDIUM]: Add offline pack install-state store for download/import/ready/failed metadata, progress clamping, installed entry counts, failure copy, and deletion coverage.
- [x] DONE [MEDIUM]: Wire offline pack install-state metadata into Profile so local install status, ready count, and clear-all-data cleanup are visible in UI and covered by Playwright smoke.
- [x] DONE [HARD]: Offline dictionary MVP Phase 1: SQLite schema and pack pipeline documented in `docs/offline-dictionary-mvp.md`, prototype JSONL-to-gzip pack builder added in `scripts/build-offline-pack.mjs`, focused pack-builder/pack-status/lookup/store test coverage added, and Profile shows an offline pack status shell with Wiktionary/Kaikki CC BY-SA/GFDL attribution, runtime-gate copy, and local install-state metadata.
- [x] DONE [HARD]: Offline dictionary MVP Phase 2: Runtime SQLite import, actual file download/deletion, and wiring per-entry offline lookup to persistent storage.
  - [x] DONE [MEDIUM]: Add Phase 2 import/storage contract: SQLite schema SQL, manifest validation, SQLite row serialization/parsing, storage port, in-memory test storage, install-state import orchestration, and focused `tests/offlineDictionaryImport.test.ts` coverage.
  - [x] DONE [HARD]: Add Expo SQLite-backed storage driver with `expo-sqlite`, deterministic per-pack database names, schema setup, transaction import, deletion, SQL-backed exact/morphology lookup routing, restart-seeded manifest routing, and focused `tests/offlineDictionarySqliteStorage.test.ts` coverage.
  - [x] DONE [HARD]: Add real pack file download/checksum handling before enabling Profile download/import actions: Expo FileSystem document-directory download adapter, deterministic artifact filenames, manifest/entries MD5 verification, install-state transitions, partial-file cleanup, and focused `tests/offlineDictionaryPackDownload.test.ts` coverage.
  - [x] DONE [HARD]: Wire Profile pack action through download, manifest parse, gzipped entries parse via `pako`, SQLite import, artifact cleanup, deletion, disabled `Chờ pack URL` UI state, focused `tests/offlineDictionaryPackActions.test.ts`, updated pack gating tests, and Profile e2e copy coverage.
  - [x] DONE [HARD]: Wire dictionary lookup flow to query ready SQLite packs before falling back to online adapters: `data/offlineDictionaryRuntimeLookup.ts`, adapter registry offline-first monolingual/related lookup, restart-seeded ready manifest routing, runtime failure fallback, and focused `tests/offlineDictionaryRuntimeLookup.test.ts`/`tests/adapterRegistry.test.ts` coverage.
  - [x] DONE [HARD]: Configure a hosted English offline pack source URL/checksum and enable Profile download/import smoke against a real small pack: `public/offline-packs/enwiktionary-lite/`, MD5-wired `englishOfflinePackDevSource`, native-runtime gating for Expo Web, Profile e2e copy coverage, and fixture-backed `tests/offlineDictionaryPackActions.test.ts` import smoke.

### Multilingual Dictionary Expansion
- [x] DONE [MEDIUM]: VI-VI dictionary via MinhQnd API with suggestions and relations (commit `3ec1975`).
- [x] DONE [MEDIUM]: FR-FR dictionary via hybrid local/Wiktapi source (commit `3ec1975`).
- [x] DONE [MEDIUM]: FR→VI bilingual dictionary lookup via MinhQnd lexical data (commit `8b2770d`).
- [!] BLOCKED [HARD]: VI→FR bilingual dictionary source selection; do not use machine translation as dictionary data.

### Language Family Roadmap
- [x] DONE [MEDIUM]: Austroasiatic baseline: Vietnamese (VI-VI) with dictionary API, suggestions, relations, tone/diacritic-sensitive display.
- [x] DONE [MEDIUM]: Indo-European baseline: English and French with monolingual lookup, IPA/audio when available, gender for French when source provides it.
- [x] DONE [MEDIUM]: Add language-family metadata to language config before adding more languages: `family`, `script`, `writingDirection`, `adapterKey`, `dictionaryStatus` (commit `083addb`).
- [x] DONE [MEDIUM]: Build adapter registry by language pair/family so each new language declares source, morphology strategy, romanization, and blocked states (commits `1c4a0aa`, `cc9020f`, `667e897`, `536b4ad`).
- [x] DONE [MEDIUM]: Spanish monolingual baseline: WiktAPI adapter, language metadata, morphology candidates, gender labels.
- [x] DONE [MEDIUM]: Russian monolingual baseline planning: compare against English/French/Spanish Indo-European adapters, document Cyrillic/case/aspect morphology implications, and select WiktAPI/Russian Wiktionary as the live API candidate pending endpoint smoke test.
  - [x] DONE [MEDIUM]: Russian monolingual baseline implementation: Register Russian adapter, write case/aspect morphology fallbacks, using the community Russian Wiktionary (`ruwiktionary`) CC BY-SA data.
  - [x] DONE [MEDIUM]: Hindi monolingual baseline planning: Implementation BLOCKED (WiktAPI 'hi' returns 404).
  - Russian: Cyrillic, case, gender, aspect, morphology fallback required.
- [ ] TODO [HARD]: Sino-Tibetan next-build candidates: Cantonese, Burmese, Tibetan.
  - [x] DONE [HARD]: Mandarin monolingual baseline implementation: Register Mandarin adapter and integrate `Intl.Segmenter` for word segmentation, using the community Chinese Wiktionary (`zhwiktionary`) CC BY-SA data.
  - [x] DONE [HARD]: Cantonese monolingual baseline planning: document source candidates, Hanzi, jyutping, tones, traditional/simplified variants, and dictionary adapter fixture gates in `docs/cantonese-language-plan.md`.
  - [!] BLOCKED [HARD]: Cantonese monolingual baseline implementation requires a stable Words.hk hosted API or an approved local bundle path; keep `yue` unavailable until then.
  - Cantonese: Hanzi, jyutping, tones, traditional/simplified variants.
  - [x] DONE [HARD]: Burmese monolingual baseline planning: Research script-specific Burmese segmentation and dictionary source.
  - [x] DONE [HARD]: Burmese monolingual baseline implementation: Register Burmese adapter and configure tokenization fallback, using CC BY-SA data.
  - [x] DONE [HARD]: Tibetan monolingual baseline planning: Research script-specific Tibetan segmentation and dictionary source.
  - [x] DONE [HARD]: Tibetan monolingual baseline implementation: Register Tibetan adapter, configure tokenization fallback, and add local fixtures.
  - Burmese/Tibetan: script-specific segmentation and source selection required.
- [x] DONE [HARD]: Afro-Asiatic next-build candidates: Arabic, Hebrew, Amharic, Somali.
  - [x] DONE [HARD]: Arabic/Hebrew RTL baseline planning: source candidates, RTL UI/search implications, abjad/diacritic handling, root-pattern morphology, and adapter fixture gates documented in `docs/arabic-hebrew-rtl-plan.md`.
  - [x] DONE [MEDIUM]: RTL UI smoke coverage: support RTL alignment for dictionary results, search input direction, saved-word lists, and Reader tokenization/RTL paragraph wrapping.
  - [x] DONE [HARD]: Arabic/Hebrew adapter implementation: Register Arabic/Hebrew adapters and write morphology lookup logic, using CC BY-SA community dumps (`arwiktionary` and `hewiktionary`) as monolingual sources.
  - Arabic/Hebrew: RTL UI, abjad script, root-pattern morphology, diacritics.
  - [x] DONE [HARD]: Amharic monolingual baseline planning: Research Ge'ez script characteristics, transliteration, and morphology source candidates.
  - [x] DONE [HARD]: Amharic monolingual baseline implementation: Register Amharic adapter, write abugida vowel/order shift mapping morphology fallbacks, using CC BY-SA `amwiktionary` data.
  - [x] DONE [HARD]: Somali monolingual baseline planning: Research Latin-script Somali morphology, noun declension/gender, and source options.
  - [x] DONE [HARD]: Somali monolingual baseline implementation: Register Somali adapter, write definite article morphology fallbacks, using CC BY-SA data.
- [ ] TODO [MEDIUM]: Niger-Congo next-build candidates: Yoruba, Zulu, Igbo.
  - [x] DONE [MEDIUM]: Swahili monolingual baseline planning: source candidates, Latin-script search implications, and adapter fixture gates documented in `docs/swahili-language-plan.md`.
  - [x] DONE [MEDIUM]: Swahili monolingual baseline implementation: Register Swahili adapter, write noun prefix fallbacks, using the community Swahili Wiktionary (`swwiktionary`) CC BY-SA data.
  - [x] DONE [MEDIUM]: Yoruba monolingual baseline planning: Research tone marks, diacritics, and morphology fallbacks.
  - [x] DONE [MEDIUM]: Yoruba monolingual baseline implementation: Register Yoruba adapter and write tone-insensitive morphology lookup logic, using CC BY-SA data.
  - [x] DONE [MEDIUM]: Zulu monolingual baseline planning: Research noun class prefixes, locative markers, Latin orthography, and adapter fixture gates in `docs/zulu-language-plan.md`.
  - [x] DONE [MEDIUM]: Zulu monolingual baseline implementation: Register Zulu adapter, write noun class prefix lookup fallbacks, and add local fixture tests using CC BY-SA data.
  - [x] DONE [MEDIUM]: Igbo monolingual baseline planning: Research tone marks, underdot orthography, vowel harmony, and source candidates in `docs/igbo-language-plan.md`.
  - [x] DONE [MEDIUM]: Igbo monolingual baseline implementation: Register Igbo adapter, add tone-insensitive underdot-preserving lookup, and local fixture tests using source-gated local educational fixture data.
  - Swahili/Zulu: noun classes and prefixes.
  - Yoruba/Igbo: tone and diacritic-safe search.
- [ ] TODO [MEDIUM]: Austronesian next-build candidates: Tagalog, Javanese, Hawaiian.
  - [x] DONE [MEDIUM]: Malay monolingual baseline: WiktAPI adapter, simple affix/reduplication morphology candidates.
  - [x] DONE [HARD]: Tagalog monolingual baseline planning: document source candidates, focus/voice system, affix-heavy morphology, and adapter fixture gates in `docs/tagalog-language-plan.md`.
  - [x] DONE [HARD]: Tagalog monolingual baseline implementation: Register Tagalog adapter, write focus trigger and reduplication/infixation fallbacks, using CC BY-SA `tlwiktionary` data.
  - [x] DONE [HARD]: Javanese monolingual baseline planning: Research Javanese script, speech registers (Ngoko/Krama), and morphology.
  - [x] DONE [HARD]: Javanese monolingual baseline implementation: Register Javanese adapter, write active/passive morphology fallbacks, using CC BY-SA data.
  - [x] DONE [MEDIUM]: Hawaiian monolingual baseline planning: Research Polynesian morphology, ʻokina/kahakō normalization, and source candidates in `docs/hawaiian-language-plan.md`.
  - [x] DONE [MEDIUM]: Hawaiian monolingual baseline implementation: Register Hawaiian adapter, normalize ʻokina variants, add kahakō-aware fixture lookup, and local fixture tests.
  - Tagalog: focus/voice system and affix-heavy morphology.
  - Javanese/Hawaiian: register or diacritic-sensitive search.
- [x] DONE [HARD]: Dravidian next-build candidates: Tamil, Telugu, Kannada, Malayalam.
  - [x] DONE [HARD]: Tamil monolingual baseline planning: Research Tamil script, agglutinative morphology, transliteration, and source candidates.
  - [x] DONE [HARD]: Tamil monolingual baseline implementation: Register Tamil adapter, write nominal/verbal oblique suffix morphology fallbacks, and add local fixtures.
  - [x] DONE [HARD]: Telugu monolingual baseline planning: Research Telugu script, agglutinative morphology, transliteration, and source candidates.
  - [x] DONE [HARD]: Telugu monolingual baseline implementation: Register Telugu adapter, write suffix morphology fallbacks, and add local fixtures.
  - [x] DONE [HARD]: Kannada monolingual baseline planning: Research Kannada script, agglutinative morphology, transliteration, and source candidates.
  - [x] DONE [HARD]: Kannada monolingual baseline implementation: Register Kannada adapter, write suffix morphology fallbacks, and add local fixtures.
  - [x] DONE [HARD]: Malayalam monolingual baseline planning: Research Malayalam script, agglutinative morphology, transliteration, and source candidates.
  - [x] DONE [HARD]: Malayalam monolingual baseline implementation: Register Malayalam adapter, write suffix morphology fallbacks, and add local fixtures.
  - Requires native script support, transliteration, agglutinative morphology, lemma fallback.
- [~] IN PROGRESS [HARD]: Turkic next-build candidates: Turkish, Uzbek, Kazakh, Uyghur.
  - [x] DONE [HARD]: Turkish monolingual baseline planning: source candidates, Latin-script search implications, agglutinative morphology, vowel harmony, case suffixes, and fixture/test gates documented in `docs/turkish-language-plan.md`.
  - [x] DONE [HARD]: Turkish monolingual baseline implementation: register Turkish adapter, parse suffix chains, and add a test fixture for common words.
  - [x] DONE [HARD]: Uzbek monolingual baseline planning: Latin/Cyrillic script handling, apostrophe normalization, agglutinative morphology implications, source smoke, and implementation gates documented in `docs/uzbek-language-plan.md` and `docs/uzbek-source-smoke.md`.
  - [!] BLOCKED [HARD]: Uzbek monolingual baseline implementation requires a true Uzbek-definition source with approved API/terms; Kaikki English-edition data is useful for forms but not sufficient for `uz -> uz` definitions.
  - [x] DONE [HARD]: Kazakh monolingual baseline planning: Cyrillic/Latin script duality, full vowel harmony, 7-case morphology fallbacks, source candidates (Sozdik.kz, kkwiktionary Kaikki dump), and gated implementation plan documented in `docs/kazakh-language-plan.md`.
  - [x] DONE [HARD]: Kazakh source smoke: `docs/kazakh-source-smoke.md` confirms Kaikki `kkwiktionary` raw data is not available, WiktAPI `kk` is not viable, and Kazakh Wiktionary MediaWiki API is accepted for curated CC BY-SA fixtures and adapter work.
  - [x] DONE [HARD]: Kazakh monolingual baseline implementation: register Kazakh metadata, add curated Kazakh Wiktionary fixtures with attribution, parse noun/adjective/verb definitions, and cover Cyrillic morphology fallbacks.
  - Turkish first: agglutinative suffixes, vowel harmony, case/morphology search.
  - Uzbek/Kazakh/Uyghur need script-specific source strategy.
- [ ] TODO [HARD]: Uralic next-build candidates: Finnish, Hungarian, Estonian.
  - [x] DONE [HARD]: Finnish monolingual baseline planning: source candidates, Latin-script/diacritic search implications, case-rich agglutinative morphology, vowel harmony, and adapter fixture gates documented in `docs/finnish-language-plan.md`.
  - [x] DONE [HARD]: Finnish monolingual baseline implementation: Register the Finnish adapter, add tiny test fixtures under the CC BY-SA license from the community Finnish Wiktionary (`fiwiktionary`), and write morphology fallback rules for noun/verb case endings.
  - [x] DONE [HARD]: Hungarian monolingual baseline planning: source candidates, Latin-script/diacritic search implications, case-rich agglutinative morphology, vowel harmony, and adapter fixture gates documented in `docs/hungarian-language-plan.md`.
  - [x] DONE [HARD]: Hungarian monolingual baseline implementation: Register the Hungarian adapter, add tiny test fixtures under the CC BY-SA license from `huwiktionary`, and write morphology fallback rules.
  - [x] DONE [HARD]: Estonian monolingual baseline planning: compare against Finnish/Hungarian Uralic baselines, run source smoke checks, and document case-rich morphology/search implications in `docs/estonian-language-plan.md`.
  - [!] BLOCKED [HARD]: Estonian monolingual baseline implementation requires a true Estonian-definition source.
  - Case-rich morphology and lemmatization are required before production lookup.
- [x] DONE [HARD]: Japanese/Korean lookup track planning: script, segmentation, romanization/pronunciation, and source strategy documented before adapter implementation.
  - [x] DONE [HARD]: Japanese/Korean source smoke tests: WiktAPI `ja`/`ko` returned 404 for common headwords, and Kaikki English-Wiktionary-derived datasets do not satisfy monolingual-first by themselves.
  - [x] DONE [HARD]: Japanese/Korean monolingual source candidates identified: Kaikki/Wiktextract raw data from `jawiktionary` and `kowiktionary` provide Japanese/Korean-edition gloss metadata; adapter implementation still requires tiny fixture smoke first.
  - [x] DONE [HARD]: Japanese/Korean raw dump noun/verb smoke: `猫`, `たべる`, `사랑`, and `먹다` confirm target-language glosses and useful metadata in raw dumps; hosted WiktAPI direct word endpoints still return 404 for sampled JA/KO words.
  - [x] DONE [HARD]: Japanese/Korean adapter implementation unblocked: source licensing/attribution policy accepted; next step is to register the adapters, construct simple lookup fixtures, and query NIKL Open API for Korean.
  - [x] DONE [HARD]: Japanese monolingual baseline implementation: register Japanese adapter, write kana/kanji normalization, and construct simple local lookup fixtures.
  - [x] DONE [HARD]: Korean monolingual baseline implementation: register Korean adapter, construct local lookup fixtures, and write particles/adjective ending fallback rules.
  - Japanese: kana/kanji, romaji, tokenizer, pitch accent if source supports it.
  - Korean: Hangul, romanization, particles, verb/adjective endings; treat as Korean-specific, not dependent on disputed Altaic grouping.
- [!] BLOCKED [HARD]: Amerind/proposed-family candidates: Quechua, Nahuatl, Guarani.
  - Do not treat Amerind as a production taxonomy; choose each language only after source/license research.
- [!] BLOCKED [HARD]: Isolate-language candidates: Basque, Ainu, Korean if modeled as isolate.
  - Basque can be researched after Indo-European Latin-script pipeline; Ainu is blocked until source availability is proven.

### Translation
- [x] DONE [MEDIUM]: Language selector and bilingual dictionary flow; supported/blocked pair rules are centralized, unsupported pair routing is guarded, and API/UI coming-soon behavior is covered by tests.
- [!] BLOCKED [HARD]: Production multilingual translation for many language pairs needs selected API/backend.
- [!] BLOCKED [HARD]: Specialized translation with user glossary/database needs backend, auth, and cost controls.

### Etymology And Conjugation
- [x] DONE [HARD]: Draft etymology/conjugation source decision brief with legal structured source candidates and keep production integration blocked while decision remains Proposed.
- [x] DONE [HARD]: Choose legal structured resource for etymology via accepted decision in `.docs/decisions/etymology-conjugation-source.md` (Option 1: Wiktionary-derived live data with attribution).
- [x] DONE [HARD]: Choose reliable resource for conjugation via accepted decision in `.docs/decisions/etymology-conjugation-source.md` (Option 2: UniMorph for structured paradigm exploration).
- [x] DONE [HARD]: Etymology/conjugation source option selection accepted by product owner in `.docs/decisions/etymology-conjugation-source.md`; implementation remains subject to attribution and offline licensing constraints.
- [x] DONE [HARD]: Etymology source integration slice (Wiktionary-derived attribution): adapter contract, UI attribution behavior, and missing-source fallback coverage are implemented before enabling production data path. Verification: `npm test -- --run tests/etymologyAdapter.test.ts`, `npm test -- --run`, `npx tsc --noEmit`, `npm run lint`, and Expo web HTTP smoke for `/word`.
- [!] BLOCKED [HARD]: Production etymology and conjugation should not be mocked without a real resource.

### AI
- [!] BLOCKED [HARD]: Real-time voice/text chatbot needs backend, streaming, auth, and cost controls.
- [!] BLOCKED [HARD]: Specialized document translation with imported glossary needs backend and persistence strategy.

## Next Work Queue
1. [ ] [HARD] Uyghur monolingual baseline planning: research Arabic-Perso script, agglutinative morphology, ULY Latin variant, and source candidates.
2. [ ] [HARD] Uralic source/status refresh: review Finnish/Hungarian/Estonian implementation status, verify remaining source gates, and pick the next unblocked Uralic slice.
3. [ ] [MEDIUM] Niger-Congo source/status refresh: review Yoruba/Zulu/Igbo implementation status, source attribution, and remaining morphology gaps before choosing the next slice.



## Rule

### Task Workflow
1. Trước khi bắt đầu task mới, kiểm tra code hiện tại và `docs/product-progress.md` đã đồng bộ: task đang làm/đã làm đúng trạng thái, `Next Work Queue` phản ánh bước tiếp theo, và queue có tối đa 5 task.
2. Khi bắt đầu một task trong `Next Work Queue`, chuyển task đó sang `[~] IN PROGRESS` trong checklist tương ứng và trong queue.
3. Sau khi triển khai xong, cập nhật checklist theo trạng thái thực tế của code: `[x]`, `[~]`, `[ ]`, hoặc `[!]`.
4. Trước mỗi commit, kiểm tra lại tiến độ code và `docs/product-progress.md` đã đồng bộ. Nếu commit hash chưa tồn tại, có thể cập nhật `Current Baseline` ngay sau commit code bằng một commit checklist kế tiếp.
5. Trước mỗi commit code, chạy kiểm tra xác minh theo verification ladder trong `docs/testing-and-build-guide.md`: `git diff --check`, `npx tsc --noEmit`, `npm run lint`, và focused/full test suite khi shared behavior, parser, adapter, hoặc store thay đổi. Nếu chỉ sửa tài liệu, vẫn ưu tiên chạy `git diff --check`, `npx tsc --noEmit`, và `npm run lint` trừ khi có blocker rõ ràng.
6. Commit code và checklist cùng nhau khi hợp lý. Nếu cần ghi commit hash mới vào `Current Baseline`, commit cập nhật checklist ngay sau commit code.
7. Trước mỗi lần push lên GitHub, kiểm tra lại `git status`, commit gần nhất, và `docs/product-progress.md` để đảm bảo code/checklist không lệch.
8. Sau khi push, kiểm tra `main` đã đồng bộ với `origin/main` và không còn thay đổi local chưa commit.
9. Sau khi checklist trên GitHub khớp với code thực tế, mới bắt đầu task tiếp theo trong `Next Work Queue`.

### Progress Queue Rules
1. Mỗi lần cập nhật `Next Work Queue`, chỉ giữ tối đa 5 task ưu tiên nhất trong queue và trước mỗi lần commit code phải có ít nhất 3 task trong queue.
2. Các task chưa vào queue vẫn phải giữ ở section checklist tương ứng, không xóa khỏi roadmap.
3. Ưu tiên task theo thứ tự dễ đến khó, trừ khi user chọn rõ một ưu tiên khác.
4. Sau khi task trong queue chuyển sang `[x] DONE`, xóa task đó khỏi `Next Work Queue` và thêm task kế tiếp nếu còn dưới 3 mục ưu tiên hợp lệ; không kéo task `[!] BLOCKED` vào queue như việc có thể làm ngay.

### Language Build Rules
1. Trước khi build một ngôn ngữ mới, xác định language family/typology của ngôn ngữ đó và ghi vào `Language Family Roadmap`.
2. Nếu family/typology đó đã có ngôn ngữ được build trong hệ thống, so sánh ngôn ngữ mới với các baseline đã build trong cùng family trước: script, writing direction, segmentation, morphology, pronunciation/IPA, romanization, gender/case/tone/classifier/noun class, dictionary source, và UI/search implications.
3. Nếu family/typology đó chưa có ngôn ngữ nào được build, research và phân tích đặc điểm ngôn ngữ trước để tạo baseline đầu tiên cho family đó, rồi mới lập plan implement.
4. Khi build một ngôn ngữ mới, luôn build từ điển tra cứu trong cùng ngôn ngữ trước (monolingual: `lang -> lang`) với definition, part of speech, pronunciation/IPA/audio nếu có, và các field đặc thù của ngôn ngữ đó. Chỉ sau khi monolingual lookup ổn mới mở bilingual dictionary từ/ngôn ngữ đó sang các ngôn ngữ đã build trong hệ thống.
5. Bilingual dictionary giữa hai ngôn ngữ phải dùng nguồn dictionary/lexical source đáng tin; không dùng machine translation để giả lập definition từ điển.
6. Với các nhóm gây tranh luận như Altaic hoặc Amerind, chỉ dùng như bucket kỹ thuật/roadmap; không coi là taxonomy production khi thiết kế dữ liệu.
