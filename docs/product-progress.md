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
- Easy next tasks: no active easy task selected; keep future work to copy polish and small local UI cleanup only when a concrete 3-5 task module is selected.
- Medium next tasks: legacy AsyncStorage cleanup is implemented; no unblocked medium module is currently selected.
- Hard next tasks: Supabase auth/backend, DeepL/OpenAI proxy, MLKit OCR, OS/native STT, Azure speech scoring, support feedback, and auth token storage decisions are accepted; remaining hard work should advance through staged TODO modules with dependency gates, while language-source production work stays blocked until source gates pass.

## Current Baseline
- Latest completed commits:
  - `a4689ef` feat(database): clean up legacy user data storage
  - `06c6ccf` feat(database): adopt sqlite user runtime
  - `06e4543` feat(database): add local user data migration bridge
  - `8980dfc` docs(database): define user data migration readiness
  - `9084c84` docs(database): plan local-first database architecture
  - `342b63b` docs(progress): audit remaining roadmap blockers
  - `146d633` feat(recognition): add OCR readiness boundary
  - `51c8a97` docs(progress): set voice ocr readiness queue
  - `22d9dab` feat(lang): add Hindi monolingual baseline
  - `3c9ddb6` feat(lang): add Estonian monolingual baseline
  - `b838d8a` docs(lang): complete source gate unblock module
  - `ec31bd9` docs(lang): refresh language source status module
  - `adc2a84` docs(progress): define module work queue
  - `f4c5ab4` docs(lang): complete Uyghur source smoke
  - `7ddaa16` docs(lang): plan Uyghur monolingual baseline
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
- [ ] TODO [HARD]: Voice Search / OCR Camera Lookup (Tìm kiếm bằng giọng nói / Dịch qua hình ảnh).
  - [x] DONE [HARD]: Architecture/library evaluation and staged implementation plan: `docs/voice-ocr-plan.md`.
  - [x] DONE [HARD]: Implementation Phase 1: Word screen Voice/OCR entry points, microphone/photo-library permission flow, local audio/image capture hooks, deterministic STT/OCR prototype results, and lookup routing covered by `tests/recognition.test.ts`.
  - [x] DONE [HARD]: Implementation Phase 2: capture previews for local audio/image inputs, OCR camera preview entry, manual dev-client smoke matrix, and on-device OCR/STT engine shortlist documented in `docs/voice-ocr-plan.md`.
  - [x] DONE [HARD]: Stage 3 readiness: package-agnostic OCR engine contract, deterministic block/line parser, selectable OCR candidates, dev-client-gated native OCR state, and `tests/ocrEngine.test.ts` coverage.
  - [ ] TODO [HARD]: Real on-device OCR integration can start with a maintained MLKit Text Recognition wrapper, validated behind the existing OCR engine contract in an Expo dev-client/custom native build.
  - [ ] TODO [HARD]: Real on-device STT integration can start with OS/native speech recognizers, validating privacy, offline behavior, and unavailable-engine fallbacks in a dev-client build.

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
- [ ] TODO [HARD]: Google Sheets export via backend-mediated Google OAuth, staged after Supabase auth/backend foundation and Google Sheets export contract docs.

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
- [ ] TODO [HARD]: Real password/email/phone verification changes can be planned against Supabase Auth; keep UI clearly marked as local/coming soon until auth is implemented.
- [x] DONE [MEDIUM]: Persist notification preferences locally until cloud sync/auth is selected.
- [x] DONE [EASY]: Add Privacy settings sidebar item that links to local-first privacy copy, app lock, data export, and local data reset.
- [x] DONE [EASY]: Add Support settings items: Help center and Feedback.
- [ ] TODO [HARD]: Feedback submission can be planned with Supabase feedback table plus Resend backend email notification after Supabase backend scaffolding, RLS, retention, spam controls, and fake email-client tests are defined.
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
- [ ] TODO [HARD]: Email login/auth can be planned against Supabase Auth.
- [ ] TODO [HARD]: Cloud sync and encrypted backup can be planned against Supabase auth/backend, with encrypted backup policy still staged as its own implementation decision.
- [ ] TODO [HARD]: Account deletion workflow can be planned against Supabase account/backend support and local-data deletion contracts.

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
  - [x] DONE [MEDIUM]: Hindi monolingual baseline planning: original WiktAPI `hi` endpoint stayed blocked, but tiny `hiwiktionary` MediaWiki fixtures are now accepted for the local baseline.
  - [x] DONE [HARD]: Hindi monolingual baseline implementation: register Hindi metadata/adapter routing, add curated `hiwiktionary` fixtures, normalize Devanagari variants, add conservative noun/verb morphology fallbacks, and cover lookup behavior with tests.
  - Russian: Cyrillic, case, gender, aspect, morphology fallback required.
- [!] BLOCKED [HARD]: Sino-Tibetan next-build candidates: Cantonese, Burmese, Tibetan.
  - [x] DONE [HARD]: Mandarin monolingual baseline implementation: Register Mandarin adapter and integrate `Intl.Segmenter` for word segmentation, using the community Chinese Wiktionary (`zhwiktionary`) CC BY-SA data.
  - [x] DONE [HARD]: Cantonese monolingual baseline planning: document source candidates, Hanzi, jyutping, tones, traditional/simplified variants, and dictionary adapter fixture gates in `docs/cantonese-language-plan.md`.
  - [!] BLOCKED [HARD]: Cantonese monolingual baseline implementation requires a stable Words.hk hosted API or an approved local bundle path; keep `yue` unavailable until then.
  - Cantonese: Hanzi, jyutping, tones, traditional/simplified variants.
  - [x] DONE [HARD]: Burmese monolingual baseline planning: Research script-specific Burmese segmentation and dictionary source.
  - [x] DONE [HARD]: Burmese monolingual baseline implementation: Register Burmese adapter and configure tokenization fallback, using CC BY-SA data.
  - [x] DONE [HARD]: Tibetan monolingual baseline planning: Research script-specific Tibetan segmentation and dictionary source.
  - [x] DONE [HARD]: Tibetan monolingual baseline implementation: Register Tibetan adapter, configure tokenization fallback, and add local fixtures.
  - [x] DONE [HARD]: Sino-Tibetan source/status refresh: `docs/cantonese-language-plan.md`, `docs/burmese-language-plan.md`, and `docs/tibetan-language-plan.md` now reflect Cantonese unavailable metadata, Burmese/Tibetan implemented adapters, and remaining bulk/source gates.
  - [x] DONE [HARD]: Cantonese source unblock attempt: `docs/cantonese-source-smoke.md` confirms Words.hk public-domain word/pronunciation lists are safe for non-definition helpers, but full monolingual definitions remain blocked pending compatible permission.
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
- [x] DONE [MEDIUM]: Niger-Congo next-build candidates: Yoruba, Zulu, Igbo.
  - [x] DONE [MEDIUM]: Swahili monolingual baseline planning: source candidates, Latin-script search implications, and adapter fixture gates documented in `docs/swahili-language-plan.md`.
  - [x] DONE [MEDIUM]: Swahili monolingual baseline implementation: Register Swahili adapter, write noun prefix fallbacks, using the community Swahili Wiktionary (`swwiktionary`) CC BY-SA data.
  - [x] DONE [MEDIUM]: Yoruba monolingual baseline planning: Research tone marks, diacritics, and morphology fallbacks.
  - [x] DONE [MEDIUM]: Yoruba monolingual baseline implementation: Register Yoruba adapter and write tone-insensitive morphology lookup logic, using CC BY-SA data.
  - [x] DONE [MEDIUM]: Zulu monolingual baseline planning: Research noun class prefixes, locative markers, Latin orthography, and adapter fixture gates in `docs/zulu-language-plan.md`.
  - [x] DONE [MEDIUM]: Zulu monolingual baseline implementation: Register Zulu adapter, write noun class prefix lookup fallbacks, and add local fixture tests using CC BY-SA data.
  - [x] DONE [MEDIUM]: Igbo monolingual baseline planning: Research tone marks, underdot orthography, vowel harmony, and source candidates in `docs/igbo-language-plan.md`.
  - [x] DONE [MEDIUM]: Igbo monolingual baseline implementation: Register Igbo adapter, add tone-insensitive underdot-preserving lookup, and local fixture tests using source-gated local educational fixture data.
  - [x] DONE [MEDIUM]: Niger-Congo source/status refresh: `docs/yoruba-language-plan.md`, `docs/zulu-language-plan.md`, and `docs/igbo-language-plan.md` now reflect implemented adapters, fixture paths, morphology coverage, and remaining bulk/source gates.
  - Swahili/Zulu: noun classes and prefixes.
  - Yoruba/Igbo: tone and diacritic-safe search.
- [x] DONE [MEDIUM]: Austronesian next-build candidates: Tagalog, Javanese, Hawaiian.
  - [x] DONE [MEDIUM]: Malay monolingual baseline: WiktAPI adapter, simple affix/reduplication morphology candidates.
  - [x] DONE [HARD]: Tagalog monolingual baseline planning: document source candidates, focus/voice system, affix-heavy morphology, and adapter fixture gates in `docs/tagalog-language-plan.md`.
  - [x] DONE [HARD]: Tagalog monolingual baseline implementation: Register Tagalog adapter, write focus trigger and reduplication/infixation fallbacks, using CC BY-SA `tlwiktionary` data.
  - [x] DONE [HARD]: Javanese monolingual baseline planning: Research Javanese script, speech registers (Ngoko/Krama), and morphology.
  - [x] DONE [HARD]: Javanese monolingual baseline implementation: Register Javanese adapter, write active/passive morphology fallbacks, using CC BY-SA data.
  - [x] DONE [MEDIUM]: Hawaiian monolingual baseline planning: Research Polynesian morphology, ʻokina/kahakō normalization, and source candidates in `docs/hawaiian-language-plan.md`.
  - [x] DONE [MEDIUM]: Hawaiian monolingual baseline implementation: Register Hawaiian adapter, normalize ʻokina variants, add kahakō-aware fixture lookup, and local fixture tests.
  - [x] DONE [MEDIUM]: Austronesian source/status refresh: `docs/tagalog-language-plan.md`, `docs/javanese-language-plan.md`, and `docs/hawaiian-language-plan.md` now reflect implemented adapters, fixture paths, morphology coverage, and remaining production/bulk source gates.
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
- [!] BLOCKED [HARD]: Turkic next-build candidates: Turkish, Uzbek, Kazakh, Uyghur.
  - [x] DONE [HARD]: Turkish monolingual baseline planning: source candidates, Latin-script search implications, agglutinative morphology, vowel harmony, case suffixes, and fixture/test gates documented in `docs/turkish-language-plan.md`.
  - [x] DONE [HARD]: Turkish monolingual baseline implementation: register Turkish adapter, parse suffix chains, and add a test fixture for common words.
  - [x] DONE [HARD]: Uzbek monolingual baseline planning: Latin/Cyrillic script handling, apostrophe normalization, agglutinative morphology implications, source smoke, and implementation gates documented in `docs/uzbek-language-plan.md` and `docs/uzbek-source-smoke.md`.
  - [x] DONE [HARD]: Uzbek monolingual baseline implementation: tiny curated `uzwiktionary` fixtures are source-accepted via MediaWiki API under CC BY-SA 4.0; Izoh.uz and bulk/offline Uzbek remain blocked pending terms.
  - [x] DONE [HARD]: Kazakh monolingual baseline planning: Cyrillic/Latin script duality, full vowel harmony, 7-case morphology fallbacks, source candidates (Sozdik.kz, kkwiktionary Kaikki dump), and gated implementation plan documented in `docs/kazakh-language-plan.md`.
  - [x] DONE [HARD]: Kazakh source smoke: `docs/kazakh-source-smoke.md` confirms Kaikki `kkwiktionary` raw data is not available, WiktAPI `kk` is not viable, and Kazakh Wiktionary MediaWiki API is accepted for curated CC BY-SA fixtures and adapter work.
  - [x] DONE [HARD]: Kazakh monolingual baseline implementation: register Kazakh metadata, add curated Kazakh Wiktionary fixtures with attribution, parse noun/adjective/verb definitions, and cover Cyrillic morphology fallbacks.
  - [x] DONE [HARD]: Uyghur monolingual baseline planning: Arabic-script RTL requirements, ULY romanization role, agglutinative morphology, source candidates, and implementation gates documented in `docs/uyghur-language-plan.md` and `docs/uyghur-source-smoke.md`.
  - [x] DONE [HARD]: Uyghur source smoke: sampled `ug.wiktionary.org` MediaWiki API pages and confirmed the current candidate set is insufficient for balanced noun/adjective/verb fixtures.
  - [!] BLOCKED [HARD]: Uyghur monolingual baseline implementation requires another approved Uyghur-definition source or a larger non-placeholder Uyghur Wiktionary candidate list before fixtures or adapter code.
  - [x] DONE [HARD]: Turkic blocked-source follow-up: `docs/uzbek-language-plan.md`, `docs/uyghur-language-plan.md`, and `docs/kazakh-language-plan.md` now reflect current code status, Kazakh implemented baseline, and remaining Uzbek/Uyghur source gates.
  - [x] DONE [HARD]: Uzbek source unblock: `docs/uzbek-source-smoke.md` confirms `uy`, `kitob`, `qilmoq`, and `oʻzbek` have native Uzbek definitions on `uz.wiktionary.org`; adapter work can proceed with tiny CC BY-SA fixtures.
  - [x] DONE [HARD]: Uyghur source unblock attempt: `docs/uyghur-source-smoke.md` remains blocked because no new approved source or balanced non-placeholder candidate set was found.
  - Turkish first: agglutinative suffixes, vowel harmony, case/morphology search.
  - Uzbek/Kazakh/Uyghur need script-specific source strategy.
- [x] DONE [HARD]: Uralic next-build candidates: Finnish, Hungarian, Estonian.
  - [x] DONE [HARD]: Finnish monolingual baseline planning: source candidates, Latin-script/diacritic search implications, case-rich agglutinative morphology, vowel harmony, and adapter fixture gates documented in `docs/finnish-language-plan.md`.
  - [x] DONE [HARD]: Finnish monolingual baseline implementation: Register the Finnish adapter, add tiny test fixtures under the CC BY-SA license from the community Finnish Wiktionary (`fiwiktionary`), and write morphology fallback rules for noun/verb case endings.
  - [x] DONE [HARD]: Hungarian monolingual baseline planning: source candidates, Latin-script/diacritic search implications, case-rich agglutinative morphology, vowel harmony, and adapter fixture gates documented in `docs/hungarian-language-plan.md`.
  - [x] DONE [HARD]: Hungarian monolingual baseline implementation: Register the Hungarian adapter, add tiny test fixtures under the CC BY-SA license from `huwiktionary`, and write morphology fallback rules.
  - [x] DONE [HARD]: Estonian monolingual baseline planning: compare against Finnish/Hungarian Uralic baselines, run source smoke checks, and document case-rich morphology/search implications in `docs/estonian-language-plan.md`.
  - [x] DONE [HARD]: Estonian monolingual baseline implementation: register Estonian metadata and adapter dispatch, add tiny curated `etwiktionary` fixtures, preserve `ä/ö/ü/õ`, add fixture-backed case/verb fallbacks, and cover lookup behavior with tests.
  - [x] DONE [HARD]: Uralic source/status refresh: `docs/finnish-language-plan.md`, `docs/hungarian-language-plan.md`, and `docs/estonian-language-plan.md` now reflect implemented Finnish/Hungarian adapters, Estonian source-gated status, and remaining production/bulk source gates.
  - [x] DONE [HARD]: Estonian source unblock: `docs/estonian-source-smoke.md` confirms `etwiktionary` native-definition fixtures are acceptable for a tiny baseline, while Sõnaveeb/Ekilex stays as a later CC BY 4.0 API candidate.
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
- [ ] TODO [HARD]: Production multilingual translation can be planned with DeepL through a Supabase/backend proxy, quota limits, and privacy controls.
- [ ] TODO [HARD]: Specialized translation with user glossary/database can be planned with DeepL glossary support and backend persistence after Supabase auth/backend foundation.

### Etymology And Conjugation
- [x] DONE [HARD]: Draft etymology/conjugation source decision brief with legal structured source candidates and keep production integration blocked while decision remains Proposed.
- [x] DONE [HARD]: Choose legal structured resource for etymology via accepted decision in `.docs/decisions/etymology-conjugation-source.md` (Option 1: Wiktionary-derived live data with attribution).
- [x] DONE [HARD]: Choose reliable resource for conjugation via accepted decision in `.docs/decisions/etymology-conjugation-source.md` (Option 2: UniMorph for structured paradigm exploration).
- [x] DONE [HARD]: Etymology/conjugation source option selection accepted by product owner in `.docs/decisions/etymology-conjugation-source.md`; implementation remains subject to attribution and offline licensing constraints.
- [x] DONE [HARD]: Etymology source integration slice (Wiktionary-derived attribution): adapter contract, UI attribution behavior, and missing-source fallback coverage are implemented before enabling production data path. Verification: `npm test -- --run tests/etymologyAdapter.test.ts`, `npm test -- --run`, `npx tsc --noEmit`, `npm run lint`, and Expo web HTTP smoke for `/word`.
- [!] BLOCKED [HARD]: Production etymology and conjugation should not be mocked without a real resource.

### AI
- [ ] TODO [HARD]: Real-time voice/text chatbot can be planned with OpenAI through a backend proxy, streaming, auth, rate limits, and cost controls.
- [ ] TODO [HARD]: Specialized document translation with imported glossary can be planned with DeepL/OpenAI proxy boundaries and backend persistence strategy.

## Completed Work Modules

**Module: Language source/status refresh** - DONE
- Uralic: refreshed Finnish/Hungarian implemented status and Estonian source-gated status.
- Niger-Congo: refreshed Yoruba/Zulu/Igbo implemented status and bulk/source gates.
- Austronesian: refreshed Tagalog/Javanese/Hawaiian implemented status and production/bulk source gates.
- Sino-Tibetan: refreshed Cantonese blocked status and Burmese/Tibetan implemented status.
- Turkic: refreshed Uzbek/Uyghur blocked status and Kazakh implemented status.

**Module: Source gate unblock** - DONE
- Estonian: accepted tiny `etwiktionary` CC BY-SA fixture path; Sõnaveeb/Ekilex remains production/API-key gated.
- Cantonese: kept full-definition adapter blocked; Words.hk public-domain lists are only safe for non-definition helpers.
- Uzbek: accepted tiny `uzwiktionary` CC BY-SA fixture path; Izoh.uz and bulk/offline paths remain gated.
- Uyghur: kept adapter blocked because the candidate set still lacks enough balanced non-placeholder native-definition fixtures.
- Cross-family attribution: documented shared fixture/offline-pack metadata requirements in `docs/source-attribution-packaging.md`.

**Module: Estonian monolingual baseline** - DONE
- Metadata/registry: registered `et` language metadata, adapter dispatch, and dictionary API routing.
- Fixtures: added tiny `etwiktionary`-attributed local entries for `maja`, `jää`, `öö`, and `sööma`.
- Normalization/morphology: preserved Estonian diacritics and added conservative fixture-backed case/verb fallbacks.
- Tests: covered exact lookup, fallback lookup, missing-source behavior, related words, adapter registration, and normalization.
- Docs/progress: updated Estonian plan, source smoke status, and this queue before verification and commit.

**Module: Uzbek monolingual baseline** - DONE
- Metadata/registry: registered `uz` in `data/languages.ts` (turkic family, LTR, monolingual-only), `data/languageNormalization.ts` (`uz-UZ` locale), `data/adapterRegistry.ts`, and `data/dictionaryApi.ts` dispatch.
- Fixtures: added `uzbekDictionaryEntries` in `data/localLexicon.ts` for `uy`, `kitob`, `qilmoq`, and `oʻzbek` with CC BY-SA 4.0 attribution from Uzbek Wiktionary.
- Normalization/script: implemented `normalizeUzbekWord` (apostrophe-variant normalizer) and `transliterateUzbekCyrillicToLatin` (Cyrillic→Latin fallback) in both `data/localLexicon.ts` and `data/morphology.ts`.
- Morphology: implemented `getUzbekMorphologyCandidates` with noun case/plural and verb conjugation suffix stripping to `-moq` base form.
- Tests: 7 new tests in `tests/dictionaryApi.test.ts` covering exact lookup, case/plural suffixes, verb suffixes, apostrophe variants, Cyrillic transliteration, related words, and adapter surface gate; adapter registry test updated.
- Docs/progress: updated `docs/uzbek-language-plan.md`, `docs/uzbek-source-smoke.md`, and this file; full suite passes (214 tests, 19 files).

**Module: Hindi monolingual baseline** - DONE
- Metadata/registry: registered `hi` in `data/languages.ts` (Indo-Aryan, Devanagari, LTR, monolingual-only), `data/languageNormalization.ts` (`hi-IN` locale), `data/adapterRegistry.ts`, and `data/dictionaryApi.ts` dispatch.
- Fixtures: added `hindiDictionaryEntries` in `data/localLexicon.ts` for `घर`, `किताब`, `करना`, and `हिंदी` with CC BY-SA 4.0 attribution from Hindi Wiktionary.
- Normalization/script: implemented `normalizeHindiWord` with NFC, chandrabindu/anusvara handling, and a narrow `हिन्दी` -> `हिंदी` spelling variant while keeping Latin transliteration out of scope.
- Morphology: implemented `getHindiMorphologyCandidates` with oblique/plural, postposition-attached noun forms, and fixture-backed `करना` verb forms.
- Tests: new coverage in `tests/dictionaryApi.test.ts`, `tests/adapterRegistry.test.ts`, and `tests/languageNormalization.test.ts` for exact lookup, form fallback, Devanagari-only behavior, related words, adapter registration, and normalization.
- Docs/progress: updated `docs/hindi-language-plan.md` and this file; full verification passes (220 tests, 19 files).

**Module: Voice/OCR Stage 3 readiness** - DONE
- Audit: reconciled `app/(tabs)/word.tsx`, `data/recognition.ts`, `data/recognitionCapture.ts`, and tests against `docs/voice-ocr-plan.md` Stage 3 expectations.
- OCR engine contract: added `data/ocrEngine.ts` with package-agnostic result types for text, blocks, lines, confidence, bounding boxes, and unavailable-native-engine errors.
- Parsing/tests: added deterministic OCR fixture output, lookup candidate extraction, unavailable-engine tests, and updated recognition tests without requiring native OCR.
- UI readiness: updated the Word OCR modal to show local capture previews, selectable OCR lines, confidence chips, and dev-client-gated native OCR state while preserving Expo Go/Web behavior.
- Docs/progress: updated `docs/voice-ocr-plan.md` and this file. Verification: `git diff --check`, `npx tsc --noEmit`, `npm run lint`, focused recognition/OCR tests, and full `npm test -- --run` pass (223 tests, 20 files).

**Module: Remaining roadmap audit and blocker alignment** - DONE
- Counted remaining open roadmap lines after Voice/OCR Stage 3 readiness: 0 unblocked product implementation TODO/IN PROGRESS tasks, 24 blocked checklist rows, and 0 selected next-module tasks; blocked decision-prep documentation modules may still be selected.
- Reclassified stale TODO rows for real account verification and feedback submission as `[!] BLOCKED` because they explicitly require auth provider or support-channel decisions.
- Reclassified Sino-Tibetan and Turkic parent rows as `[!] BLOCKED` because their implemented languages are done and only Cantonese/Uyghur source blockers remain.
- Reclassified Voice/OCR parent row as `[!] BLOCKED` after Stage 3 readiness, with explicit blockers for native OCR and STT package/dev-client validation.
- Docs/progress: updated this file. Verification: `git diff --check`, `npx tsc --noEmit`, and `npm run lint`.

**Module: Database architecture and local-first data governance** - DONE
- Audit: mapped current persistence surfaces across `libraryStore`, `profileStore`, `readerStore`, `storageAdapter`, local export, offline pack install state, pack downloads, and SQLite pack storage.
- Architecture plan: added `docs/database-architecture-plan.md` for hybrid local-first data ownership, current storage inventory, target local user database boundary, and existing per-pack offline dictionary SQLite databases.
- Governance: documented user data vs app-owned offline-pack data, schema versioning, migration, backup/export, reset/delete, storage limits, and attribution retention rules.
- Cloud boundary: kept auth provider, backend database, cloud sync, encrypted backup, account deletion, and support-channel submission blocked until provider decisions are accepted.
- Next candidates: selected `Local user-data SQLite migration readiness` as the next implementation module while keeping backend/auth and offline-pack expansion as alternative future modules.

**Module: Local user-data SQLite migration readiness** - DONE
- Entity audit: mapped profile, notification preferences, folders, saved words, saved-word folder membership, search history, flashcards/reviews, deleted folder ids, reader documents, and reader settings.
- Schema proposal: added `dictionary-mobile-user.sqlite` readiness schema with `user_database_meta`, user profile/settings columns, folders, saved words, join tables, search history, flashcards, tombstones, reader documents, reader settings, and indexes.
- Migration strategy: documented AsyncStorage read/normalize/write flow, transaction boundary, parity checks, idempotency, rollback safety, and export safety without backend/auth dependency.
- Verification design: specified fixtures for profile, library, flashcards, reader, corrupted payload fallback, reset/delete behavior, and export compatibility.
- Docs/progress: updated `docs/database-architecture-plan.md` and this file. Verification: `git diff --check`, `npx tsc --noEmit`, and `npm run lint`.

**Module: Local user database migration bridge** - DONE
- Schema module: added `data/userDatabaseSchema.ts` with `dictionary-mobile-user.sqlite`, schema version metadata, schema SQL, Expo SQLite open/delete ports, and schema bootstrap helper.
- Row mappers: added `data/userDatabaseMappers.ts` for profile, folders, saved words, folder membership, search history, flashcards, deleted entities, reader documents, and reader settings.
- Migration orchestrator: added `data/userDatabaseMigration.ts` to run export safety, load AsyncStorage-backed state, write rows transactionally, close the database, and report parity counts.
- Tests: added `tests/userDatabaseMigration.test.ts` covering fake SQLite schema setup, idempotency, rollback-on-failure, multi-folder words, flashcard sync/delete fields, deleted folder tombstones, and reader selected-document fallback.
- Runtime boundary: existing Profile, Library, and Reader stores still read/write AsyncStorage; no backend/auth provider or offline dictionary pack schema changed.

**Module: Profile/Library/Reader SQLite runtime adoption** - DONE
- SQLite-to-store parsers: added row parsers for profile, library folders/saved words/history/flashcards/tombstones, and reader documents/settings.
- Runtime storage adapter: added `data/userDatabaseRuntime.ts` to load/write whole user-data snapshots through SQLite and switched Profile, Library, and Reader stores to SQLite-first reads/writes with AsyncStorage fallback.
- Migration-on-start: runtime adapter detects missing schema metadata, runs the migration bridge once, and reloads from SQLite while keeping failure recovery through legacy AsyncStorage.
- Reset/export boundary: Profile reset now clears Profile, Library, and Reader user data; offline dictionary pack state remains separate, and store writes keep AsyncStorage backup readable for existing JSON export.
- Tests: added `tests/userDatabaseRuntime.test.ts` covering migration-on-first-read, row parsing, adapter writes, relation dedupe, and SQLite reload behavior.

**Module: SQLite runtime smoke and legacy cleanup readiness** - DONE
- Profile smoke: verified `saveUserProfile` persists through the SQLite runtime path, reloads from SQLite, and keeps the AsyncStorage backup readable by JSON export.
- Library smoke: verified public store flows for folders, saved words, search history, and flashcards reload from SQLite without duplicate saved-word folder relations.
- Reader smoke: verified import, settings update, document selection, and selected-document fallback reload correctly from SQLite.
- Reset/export smoke: fixed user-data reset ordering to avoid parallel snapshot overwrite races, confirmed Profile/Library/Reader user data clears while offline pack metadata remains separate, and confirmed export output is explicit after reset.
- Cleanup readiness: documented gates for legacy AsyncStorage key removal, rollback expectations, and verification requirements in `docs/database-architecture-plan.md`.

**Module: Legacy user-data AsyncStorage cleanup** - DONE
- Goal: remove or quarantine old Profile/Library/Reader AsyncStorage payloads only after SQLite runtime is the confirmed primary user-data source.
- Scope: 5 related cleanup tasks; do not touch offline dictionary pack metadata or per-pack SQLite databases.
- Cleanup utility: added `data/userDataLegacyCleanup.ts` with an explicit, idempotent cleanup function that checks SQLite `schema_version=1`, required profile and reader settings rows, and readable library tables before removing legacy keys.
- Rollback guard: cleanup creates or reuses `dictionary-mobile.user-data-cleanup-backup.v1` after a successful `exportAllLocalData` run and before deleting legacy keys.
- Key boundary: cleanup removes only `dictionary-mobile.profile.v1`, `dictionary-mobile.library.v1`, and `dictionary-mobile.reader.v1`; offline pack metadata and pack SQLite databases stay out of scope.
- Tests: added `tests/userDataLegacyCleanup.test.ts` for successful cleanup, idempotency, missing schema/row skips, backup failure aborts, backup marker behavior, and offline-pack preservation.
- Docs/progress: updated `docs/database-architecture-plan.md`, `.ai/context/current-product-state.md`, and this file. Verification: `git diff --check`, `npx tsc --noEmit`, `npm run lint`, focused `npm test -- --run tests/userDataLegacyCleanup.test.ts`, and full `npm test -- --run` pass.

**Module: Post-cleanup baseline and queue sync** - DONE
- Baseline: recorded cleanup commit `a4689ef` in `Current Baseline` after it was pushed to GitHub.
- Queue status: refreshed Difficulty Overview and Next Work Module language so cleanup is no longer presented as upcoming work.
- Roadmap gate: confirmed there are no unblocked TODO/IN PROGRESS product tasks in `docs/product-progress.md`; blocked backend/auth/API/resource-dependent work remains blocked.
- Context sync: kept `.ai/context/current-product-state.md` aligned with the no-active-module state.
- Verification: docs-only sync should pass `git diff --check`, `npx tsc --noEmit`, and `npm run lint` before commit.

**Module: Accepted blocked-decision roadmap sync** - DONE
- Decisions accepted: Supabase Auth/backend/cloud sync direction, DeepL translation/glossary through backend proxy, OpenAI AI features through backend proxy, MLKit OCR direction, OS/native STT direction, and backend-mediated Google Sheets OAuth.
- Roadmap status: converted accepted decision-dependent rows from `[!] BLOCKED` to staged `[ ] TODO` while keeping speech scoring, unsupported language sources, feedback support channel, and no-mock lexical production data blocked.
- Execution order: set next module priority to lexical follow-up, recognition foundation, Supabase auth, Supabase sync, DeepL/OpenAI proxy, Google Sheets export, language source gates, then speech scoring.
- Decision docs: updated accepted ADRs under `.docs/decisions/` and added `.docs/decisions/google-sheets-export.md`.
- Guardrail: preserved `data/userDatabaseSchema.web.ts` and did not implement production auth, backend, cloud, AI, translation, OCR/STT, or export code in this docs sync.

**Module: MLKit OCR + OS/native STT Foundation** - DONE
- Next-module selection: selected this as the next work module after Accepted Lexical Source Follow-up because it improves lookup UX before auth/backend-heavy work.
- Candidate refresh: updated `docs/voice-ocr-plan.md` for Expo SDK 54 with `@infinitered/react-native-mlkit-text-recognition` v5.x as the first OCR candidate and `expo-speech-recognition` as the first OS/native STT candidate.
- Constraints: documented dev-client requirements, no-cloud privacy boundary, offline behavior caveat, Expo Go/Web fallback behavior, language/script coverage, app-size risk, permission states, and unavailable-native behavior.
- Contracts: documented OCR and STT adapter contracts that keep native packages behind `data/ocrEngine.ts`/recognition helpers and preserve deterministic fallback behavior for CI, Expo Go, and web.
- Validation: expanded the dev-client smoke matrix for iOS, Android, Expo web, airplane mode, CI/Expo Go fallback, native OCR, and OS/native STT.

**Module: Supabase Auth Foundation** - DONE
- Foundation doc: added `docs/supabase-auth-foundation.md` with Supabase project/env policy, redirect URL policy using the existing `dictionairemobile` scheme, and token/session adapter boundary.
- Session lifecycle: defined unconfigured, loading, unauthenticated, needs-verification, authenticated, and error states plus email/password sign-up, sign-in, recovery, verification, and sign-out expectations.
- Account deletion: defined local SQLite deletion scope, future Supabase remote deletion scope, offline-pack boundary, confirmation flow, and remote-failure recovery expectations.
- UI state map: mapped current local Profile/Settings behavior to auth states without treating local profile email/phone as verified identity.
- Acceptance gate: real email login, verification, sign out, and account deletion can move into a staged implementation module using accepted `expo-secure-store` native token storage plus web fallback once dependencies and adapter tests are added.

## Next Work Module

**Module: DeepL + OpenAI Proxy Request Validation Draft** - DONE
- [x] DONE [HARD]: Added `backend/proxyRequestValidation.ts` as a pure validation boundary for translation, glossary, AI chat, voice feedback, and user-provider connection requests without provider calls.
- [x] DONE [HARD]: Added translation text guards for trimming, Unicode code-point size checks, required target language, and glossary source-language requirements.
- [x] DONE [HARD]: Added glossary sanitizer rules for explicit language pairs, entry limits, trimmed terms, control-character rejection, source-term dedupe, and safe validation errors.
- [x] DONE [HARD]: Added AI/voice guards for bounded chat messages, supported roles/goals, transcript-only voice feedback, and no raw audio upload in this MVP.
- [x] DONE [HARD]: Added provider-connection request validation before encrypted user API key storage; next module is **DeepL + OpenAI Proxy Quota Guard Draft**.

**Module: User-Provided Provider Secret Encryption Foundation** - DONE
- [x] DONE [HARD]: Added `docs/user-provided-provider-secrets.md` to define the product boundary: the app provides dataset-agent workspace/setup, while users can optionally supply provider API keys through backend-only handling.
- [x] DONE [HARD]: Added `backend/userProviderSecrets.ts` to read a backend-only `USER_PROVIDER_SECRET_ENCRYPTION_KEY` without exposing user API keys to Expo/mobile clients.
- [x] DONE [HARD]: Added AES-256-GCM encryption envelopes for user provider secrets, bound to user id, provider, purpose, and key version as authenticated data.
- [x] DONE [HARD]: Added safe unconfigured-state handling and focused tests in `tests/userProviderSecrets.test.ts` for missing config, invalid key size, encryption/decryption, wrong-scope rejection, key-version mismatch, and empty-secret rejection.
- [x] DONE [HARD]: Synced `docs/deepl-openai-backend-proxy-mvp.md` and `.ai/context/blocked-decisions.md`; next module is **DeepL + OpenAI Proxy Request Validation Draft**.

**Module: DeepL + OpenAI Backend Proxy Env Guard Draft** - DONE
- [x] DONE [HARD]: Added `backend/proxyConfig.ts` to read backend-only DeepL/OpenAI env configuration without exposing provider keys to Expo/mobile clients.
- [x] DONE [HARD]: Added required env validation for `DEEPL_API_KEY`, allowed DeepL base URL, `OPENAI_API_KEY`, and `OPENAI_TEXT_MODEL`.
- [x] DONE [HARD]: Added conservative quota/cost-control defaults for translation characters, AI requests, text input size, glossary entries, and log retention.
- [x] DONE [HARD]: Added provider-unconfigured response mapping and structured log redaction for source text, translations, prompts, transcripts, glossary entries, messages, and provider keys.
- [x] DONE [HARD]: Added `tests/backendProxyConfig.test.ts`; next module is **DeepL + OpenAI Proxy Request Validation Draft**.

**Module: Supabase Cloud Sync Manual Smoke Execution Prep** - DONE
- [x] DONE [HARD]: Added `docs/supabase-cloud-sync-manual-smoke-execution.md` with the execution order for static verification, auth smoke, SQL/RLS review, RLS probes, runtime harness smoke, two-device smoke, and rollback checks.
- [x] DONE [HARD]: Added a local-only result template that avoids committing project URLs, user ids, emails, tokens, screenshots, or service-role secrets.
- [x] DONE [HARD]: Documented pass criteria for auth, RLS, harness safety, two-device create/update/delete/tombstone flow, sign-out preservation, export readability, and no-secret handling.
- [x] DONE [HARD]: Documented failure handling that keeps production sync blocked and requires focused follow-up modules.
- [x] DONE [HARD]: Linked the execution prep from `docs/supabase-cloud-sync-manual-smoke.md`; next module is **Supabase Cloud Sync Smoke Result Review** after a real disposable-project smoke run exists.

**Module: Supabase Cloud Sync Production Toggle Decision Prep** - DONE
- [x] DONE [HARD]: Added `docs/supabase-cloud-sync-production-toggle-decision.md` to define the gate before any production sync UI, lifecycle hook, or background sync.
- [x] DONE [HARD]: Documented current implemented sync foundations and explicitly listed still-missing production pieces.
- [x] DONE [HARD]: Compared manual harness only, Settings beta toggle, auto foreground sync, and background/realtime sync options.
- [x] DONE [HARD]: Recommended a Profile/Settings opt-in beta toggle only after auth, SQL/RLS, and two-device manual smoke pass.
- [x] DONE [HARD]: Documented acceptance gates and the first post-acceptance module, **Supabase Cloud Sync Profile Beta Toggle Shell**, while keeping production sync blocked.

**Module: Supabase Cloud Sync Manual Runtime Smoke Harness** - DONE
- [x] DONE [HARD]: Added `data/supabaseSyncSmokeHarness.ts` as an explicit opt-in manual harness for disposable Supabase sync smoke.
- [x] DONE [HARD]: Kept the harness skipped by default so it does not open SQLite or call Supabase without `enabled: true`.
- [x] DONE [HARD]: Required an injected Supabase client factory or client port before the harness can run.
- [x] DONE [HARD]: Added `tests/supabaseSyncSmokeHarness.test.ts` for default skip, missing-client skip, and injected-port run behavior.
- [x] DONE [HARD]: Updated manual smoke docs while keeping Profile UI, app lifecycle/background sync, realtime, encrypted backup, restore UX, and production sync toggles out of scope; next module is **Supabase Cloud Sync Production Toggle Decision Prep**.

**Module: Supabase Cloud Sync Runner Wiring Draft** - DONE
- [x] DONE [HARD]: Added `data/supabaseSyncRunner.ts` as the guarded composition point for the sync runner, runtime adapter, and local SQLite port.
- [x] DONE [HARD]: Kept default runner state unconfigured unless a real Supabase auth client factory is injected by later app wiring.
- [x] DONE [HARD]: Added selected-domain and per-run clock overrides for manual smoke and focused sync tests.
- [x] DONE [HARD]: Added `tests/supabaseSyncRunner.test.ts` for default unconfigured safety, injected port orchestration, and per-run override behavior.
- [x] DONE [HARD]: Kept UI actions, app lifecycle/background sync, realtime, encrypted backup, restore UX, and production sync toggles out of scope; next module is **Supabase Cloud Sync Manual Runtime Smoke Harness**.

**Module: Supabase Cloud Sync Local Port Draft** - DONE
- [x] DONE [HARD]: Added `data/supabaseSyncLocalPort.ts` as the SQLite local-port boundary for the existing sync runner.
- [x] DONE [HARD]: Added per-domain cursor load/record behavior using `user_sync_cursors`.
- [x] DONE [HARD]: Added dirty-row discovery for all sync domains using sync status metadata and deterministic local-change ordering.
- [x] DONE [HARD]: Added mark-pushed metadata updates and remote tombstone soft-delete application without deleting local data.
- [x] DONE [HARD]: Added `tests/supabaseSyncLocalPort.test.ts` for cursors, dirty rows, mark-pushed, and tombstone behavior; next module is **Supabase Cloud Sync Runner Wiring Draft**.

**Module: Supabase Cloud Sync Runtime Adapter Draft** - DONE
- [x] DONE [HARD]: Added `data/supabaseSyncRuntimeAdapter.ts` to create a guarded Supabase sync client port behind injected auth client, env, session, and online checks.
- [x] DONE [HARD]: Mapped sync domains to Supabase table names and remote query behavior without wiring UI, background jobs, or a production sync toggle.
- [x] DONE [HARD]: Added remote pull support using `updated_at` cursors and stable remote-change summaries for the existing sync runner.
- [x] DONE [HARD]: Added guarded upsert support that injects authenticated `user_id`, uses domain-specific conflict targets, and expects local ports to provide remote row payloads.
- [x] DONE [HARD]: Added `tests/supabaseSyncRuntimeAdapter.test.ts` for unconfigured/offline/signed-out guards, cursor pull, authenticated upsert, and table mapping; next module is **Supabase Cloud Sync Local Port Draft**.

**Module: Supabase Cloud Sync Manual Smoke Prep** - DONE
- [x] DONE [HARD]: Added `docs/supabase-cloud-sync-manual-smoke.md` with disposable Supabase project, auth-smoke dependency, and no-secret/no-service-role rules.
- [x] DONE [HARD]: Documented SQL migration review for table coverage, `user_id`, RLS enablement, own-row policies, and no realtime-by-default behavior.
- [x] DONE [HARD]: Documented RLS cross-user probes for own-row insert/select plus blocked cross-user select/update/delete and signed-out access.
- [x] DONE [HARD]: Documented two-device create, update, delete/tombstone, sign-out, and re-sign-in smoke flow for future runtime sync.
- [x] DONE [HARD]: Documented failure/rollback expectations and verification commands while keeping real Supabase calls, realtime, background jobs, encrypted backup, restore UX, and production sync toggles out of scope; next module is **Supabase Cloud Sync Runtime Adapter Draft**.

**Module: Supabase Cloud Sync Fake Client Contract** - DONE
- [x] DONE [HARD]: Added `data/supabaseSyncClient.ts` with a dependency-injected sync runner contract for fake client/local ports.
- [x] DONE [HARD]: Defined deterministic domain ordering and explicit unconfigured, offline, signed-out, synced, and failed result states.
- [x] DONE [HARD]: Added pull-before-push orchestration with per-domain cursor recording and pushed-row marking only after a successful fake push.
- [x] DONE [HARD]: Added `tests/supabaseSyncClient.test.ts` for ordering, signed-out preservation, retry-safe push failure behavior, and no-dirty cursor recording.
- [x] DONE [HARD]: Kept real Supabase calls, realtime, background jobs, encrypted backup, restore UX, and production sync toggles out of scope; next module is **Supabase Cloud Sync Manual Smoke Prep**.

**Module: Supabase Cloud Sync Mapper Contract Draft** - DONE
- [x] DONE [HARD]: Added `data/supabaseSyncMappers.ts` with pure local-to-remote and remote-to-local row contracts for all MVP sync domains.
- [x] DONE [HARD]: Mapped profile, notification preferences, folders, saved words, memberships, search history, flashcards, tombstones, reader documents, and reader settings without adding runtime sync.
- [x] DONE [HARD]: Preserved local-first ids, soft-delete timestamps, versions, JSON tag parsing, and auth-owned `user_id` in remote payloads.
- [x] DONE [HARD]: Added `tests/supabaseSyncMappers.test.ts` for mapper round trips, timestamp fallbacks, tombstones, singleton ids, and malformed tag filtering.
- [x] DONE [HARD]: Kept Supabase network calls, fake-client retry behavior, realtime, encrypted backup, restore UX, and production sync toggles out of scope; next module is **Supabase Cloud Sync Fake Client Contract**.

**Module: Supabase Cloud Sync Local Metadata Draft** - DONE
- [x] DONE [HARD]: Added `USER_SYNC_DOMAINS` to the local user database schema as the cursor domain contract for future sync.
- [x] DONE [HARD]: Added local sync metadata columns for profile, folders, saved words, memberships, search history, flashcards, tombstones, reader documents, and reader settings.
- [x] DONE [HARD]: Added `user_sync_cursors` for per-domain pull/push checkpoints without adding runtime sync or background jobs.
- [x] DONE [HARD]: Added dirty-row indexes for high-churn domains so future sync can query pending local work efficiently.
- [x] DONE [HARD]: Added `tests/userDatabaseSyncMetadata.test.ts` to verify cursor domains, metadata columns, and indexes while keeping production sync disabled.

**Module: Supabase Cloud Sync SQL/RLS Migration Draft** - DONE
- [x] DONE [HARD]: Added `supabase/migrations/001_cloud_sync_mvp.sql` with the MVP sync tables for profile, folders, saved words, memberships, search history, flashcards, tombstones, reader documents, and reader settings.
- [x] DONE [HARD]: Preserved local-first ids, timestamps, versions, soft deletes, JSON tag/preference fields, and auth-owned `user_id` scope in the migration draft.
- [x] DONE [HARD]: Enabled RLS on every sync table and added authenticated own-row select, insert, update, and delete policies scoped with `auth.uid() = user_id`.
- [x] DONE [HARD]: Added `tests/supabaseCloudSyncMigration.test.ts` to verify table coverage, RLS policy coverage, auth ownership, no service-role leakage, and metadata fields.
- [x] DONE [HARD]: Kept runtime sync, realtime subscriptions, encrypted backup, restore UX, and production sync toggles out of scope; next module is **Supabase Cloud Sync Local Metadata Draft**.

**Module: Supabase Cloud Sync MVP Implementation Prep** - DONE
- [x] DONE [HARD]: Added `docs/supabase-cloud-sync-implementation-prep.md` to convert the accepted sync MVP into an implementation slice order without enabling production sync.
- [x] DONE [HARD]: Defined the SQL/RLS migration contract, table list, policy rules, and service-role-key boundary for the future Supabase sync schema.
- [x] DONE [HARD]: Defined local SQLite sync metadata requirements for dirty rows, remote versions, per-domain cursors, tombstones, and sign-out preservation.
- [x] DONE [HARD]: Defined the sync client adapter boundary and fake-client test expectations for pull-before-push, offline/unconfigured states, conflicts, and export compatibility.
- [x] DONE [HARD]: Set the next code candidate to **Supabase Cloud Sync SQL/RLS Migration Draft** while keeping realtime, encrypted backup, restore UX, and production sync out of scope.

**Module: Current Decision Options Docs Sync** - DONE
- [x] DONE [HARD]: Created `docs/current-decision-options.md` with option matrices, recommendations, blocker status, acceptance gates, and source links for the remaining product-owner decisions.
- [x] DONE [HARD]: Documented at least three viable options for Speech Scoring Engine, with Azure AI Speech Pronunciation Assessment as the recommended MVP default if cloud audio is accepted.
- [x] DONE [HARD]: Documented per-language source options for Cantonese, Uyghur, VI->FR, Basque, Ainu, Quechua, Nahuatl, and Guarani without accepting any source or using machine translation as dictionary data.
- [x] DONE [HARD]: Documented support/feedback channel, auth token storage, and paid add-on/billing options with recommended defaults and explicit acceptance gates.
- [x] DONE [HARD]: Synced blocked-decision guardrails so production implementation remains blocked until the matching decision record changes to `Accepted`.

**Module: Accepted Product Decisions Sync** - DONE
- [x] DONE [HARD]: Accepted Azure AI Speech Pronunciation Assessment as the first speech scoring engine while keeping backend upload, privacy, retention, quota, language coverage, and fake-provider tests as implementation gates.
- [x] DONE [HARD]: Accepted language source-gate paths: Words.hk permission path for Cantonese, curated `ug.wiktionary.org` for Uyghur, DBnary/Wiktionary extraction for VI->FR, and Wiktionary/Kaikki for Basque, Ainu, Quechua, Nahuatl, and Guarani.
- [x] DONE [HARD]: Accepted Supabase feedback table plus Resend backend notification for support/feedback submission.
- [x] DONE [HARD]: Accepted Expo SecureStore on native plus web fallback for Supabase Auth token storage.
- [x] DONE [HARD]: Accepted `maxAgentsPerUser = 3` for MVP and deferred paid add-ons/billing.

**Module: Supabase Auth SecureStore Foundation** - DONE
- [x] DONE [HARD]: Installed `expo-secure-store` and registered the Expo config plugin for SDK 54 native token storage.
- [x] DONE [HARD]: Added `data/authTokenStorage.ts` as the native SecureStore-backed auth token adapter for future Supabase Auth sessions.
- [x] DONE [HARD]: Added `data/authTokenStorage.web.ts` as the Expo web/dev fallback with localStorage and SSR-safe memory fallback.
- [x] DONE [HARD]: Added focused adapter coverage in `tests/authTokenStorage.test.ts` without wiring real Supabase login or storing production tokens.
- [x] DONE [HARD]: Preserved local-first profile/library/reader behavior; real auth UI remains a future staged module.

**Module: Supabase Auth Session Adapter** - DONE
- [x] DONE [HARD]: Installed `@supabase/supabase-js` and `react-native-url-polyfill` for the accepted Supabase Auth path.
- [x] DONE [HARD]: Added `data/authConfig.ts` to keep missing `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` env state local-first and non-crashing.
- [x] DONE [HARD]: Added `data/authSession.ts` to map Supabase session/user/error outputs into the documented app auth states without treating local profile fields as verified identity.
- [x] DONE [HARD]: Added `data/supabaseAuthClient.ts` to create a typed Supabase client behind an adapter with SecureStore/web fallback persistence, PKCE, disabled URL auto-detection, and no UI imports.
- [x] DONE [HARD]: Added focused tests for config, session mapping, and client factory behavior without requiring a real Supabase project or network call.

**Module: Supabase Auth Profile UI Wiring** - DONE
- [x] DONE [HARD]: Added `data/authController.ts` to load the current Supabase auth session and sign out through the adapter without deleting local profile/library/reader data.
- [x] DONE [HARD]: Added focused controller tests for unconfigured, authenticated, and sign-out states without a real Supabase project or network call.
- [x] DONE [HARD]: Wired Profile focus loading to read the current auth snapshot alongside local profile/library/reader/offline-pack state.
- [x] DONE [HARD]: Added a Profile account auth status panel for loading, unconfigured, unauthenticated, needs-verification, authenticated, and error states.
- [x] DONE [HARD]: Updated Profile support/account actions so feedback, password, and sign-out copy reflect accepted cloud decisions while preserving local-first behavior.

**Module: Supabase Auth Form Shell** - DONE
- [x] DONE [HARD]: Extended `data/authController.ts` with email/password sign-in, sign-up, and password recovery helpers through the Supabase adapter.
- [x] DONE [HARD]: Added password recovery redirect policy using `dictionairemobile://auth/callback` without adding OAuth or callback route handling yet.
- [x] DONE [HARD]: Wired Profile account settings with email/password inputs, sign-in, create-account, and password-recovery actions that preserve local profile/library/reader data.
- [x] DONE [HARD]: Kept unconfigured Supabase env safe: auth form actions return local-first unconfigured state instead of crashing or faking login.
- [x] DONE [HARD]: Expanded focused auth controller tests for sign-in, sign-up needing verification, and password recovery callback options.

**Module: Supabase Auth Callback Route** - DONE
- [x] DONE [HARD]: Extended `data/authController.ts` with `completeAuthCallback` for Supabase callback `code`, provider error, missing-code, and unconfigured states.
- [x] DONE [HARD]: Added `app/auth/callback.tsx` route for `dictionairemobile://auth/callback` with loading, success, local-first, unauthenticated, and error states.
- [x] DONE [HARD]: Wired callback exchange through `exchangeCodeForSession` without adding OAuth providers, account deletion, sync, or backend support submission.
- [x] DONE [HARD]: Expanded auth controller tests for callback provider errors, missing callback code, and successful code exchange.
- [x] DONE [HARD]: Kept Profile as the return destination after callback so local profile data remains separate from cloud identity.

**Module: Supabase Auth Session Refresh Lifecycle** - DONE
- [x] DONE [HARD]: Added auth lifecycle event mapping from Supabase events to app `lastAuthEvent` values, including sign-in, sign-out, token refresh, recovery, and initial session.
- [x] DONE [HARD]: Added `subscribeToAuthSessionChanges` to update auth snapshots from Supabase `onAuthStateChange` without touching sync or local profile persistence.
- [x] DONE [HARD]: Added `syncAuthAutoRefreshForAppState` to start token auto-refresh while foregrounded and stop it when backgrounded.
- [x] DONE [HARD]: Wired Profile to subscribe to auth lifecycle changes and React Native `AppState` foreground/background events.
- [x] DONE [HARD]: Expanded focused auth controller tests for lifecycle event mapping, subscription cleanup, and auto-refresh start/stop behavior.

**Module: Supabase Auth Manual Smoke Prep** - DONE
- [x] DONE [HARD]: Added `docs/supabase-auth-manual-smoke.md` with local env setup, secret boundaries, and no-service-role-key rules.
- [x] DONE [HARD]: Documented Supabase Dashboard email/password and redirect allow-list setup for `dictionairemobile://auth/callback` plus local web callback smoke.
- [x] DONE [HARD]: Documented Expo web, Expo Go/native, dev-client/native, callback, foreground/background, and sign-out smoke scenarios.
- [x] DONE [HARD]: Documented expected local-first/no-local-data-delete behavior for every auth smoke path.
- [x] DONE [HARD]: Documented verification commands for auth smoke-related changes before commit.

No active Supabase Cloud Sync implementation module selected after the manual smoke execution prep because **Supabase Cloud Sync Smoke Result Review** requires a real disposable-project smoke run. Recommended active module is **DeepL + OpenAI Proxy Quota Guard Draft**, continuing the accepted backend proxy path without provider calls after env, encrypted-secret, and request-validation foundations.

## Blocked Module Execution Order

Prioritize modules by implementation complexity, user experience impact, and dependency risk:

1. **Accepted Lexical Source Follow-up** - first, because source decisions are already accepted and this improves Word detail trust/attribution without backend/auth dependencies.
2. **MLKit OCR + OS/native STT Foundation** - second, because recognition improves lookup UX immediately while staying behind dev-client validation and existing fallback contracts.
3. **Supabase Auth Foundation** - third, because accounts are the dependency for sync, export, AI proxy, and backend deletion semantics.
4. **Supabase Cloud Sync MVP** - fourth, because it depends on auth and touches shared local-first user data.
5. **DeepL + OpenAI Backend Proxy MVP** - fifth, because it needs backend auth, privacy boundaries, quota limits, and cost controls.
6. **Specialized Translation Dataset Agents** - sixth, because it builds on the DeepL/OpenAI proxy foundation and needs encrypted user-provider secret storage, dataset storage, retrieval, quota, and privacy contracts before production AI behavior.
7. **Google Sheets Export** - seventh, because backend-mediated OAuth should wait for Supabase auth/backend foundation.
8. **Language Source Gates** - eighth, because source-gate paths are accepted but production adapters remain blocked until license/sample/readiness gates pass.
9. **Speech Scoring** - last, because Azure is accepted but implementation depends on backend upload, privacy, quota, retention, first-language coverage, and fake-provider tests.

## Blocked Work Modules

These modules decompose accepted, staged, and still-blocked roadmap rows. Accepted modules can become `[ ] TODO` implementation modules; still-blocked modules remain decision-prep only until their acceptance gate is met.

**Module: Accepted Product Decisions Sync** - DONE
- [x] DONE [HARD]: Updated `.docs/decisions/speech-scoring-engine.md` to `Accepted` with Azure AI Speech Pronunciation Assessment.
- [x] DONE [HARD]: Added `.docs/decisions/support-feedback-channel.md` for Supabase feedback table plus Resend backend notification.
- [x] DONE [HARD]: Added `.docs/decisions/auth-token-storage.md` for Expo SecureStore native token storage plus web fallback.
- [x] DONE [HARD]: Added `.docs/decisions/paid-ai-agent-addons.md` to keep three active agents as the MVP limit and defer billing.
- [x] DONE [HARD]: Synced `docs/language-source-gates.md`, `docs/current-decision-options.md`, and `.ai/context/blocked-decisions.md` with accepted source-gate paths and implementation guardrails.

**Module: Supabase Auth SecureStore Foundation** - DONE
- [x] DONE [HARD]: Installed `expo-secure-store` and added the Expo config plugin.
- [x] DONE [HARD]: Added native SecureStore and web fallback auth token adapters.
- [x] DONE [HARD]: Added focused test coverage for auth token set/get/remove semantics.
- [x] DONE [HARD]: Kept Supabase client/session UI out of scope until the next auth session module.
- [x] DONE [HARD]: Updated roadmap status so future auth work can rely on accepted token storage.

**Module: Supabase Auth Session Adapter** - DONE
- [x] DONE [HARD]: Installed Supabase client and React Native URL polyfill dependencies.
- [x] DONE [HARD]: Added unconfigured-env guard for public Supabase URL/key.
- [x] DONE [HARD]: Added auth session/user/error state mapping helpers.
- [x] DONE [HARD]: Added Supabase client factory using the auth token storage adapter and PKCE session persistence.
- [x] DONE [HARD]: Added focused auth adapter tests that avoid real network/provider calls.

**Module: Supabase Auth Profile UI Wiring** - DONE
- [x] DONE [HARD]: Added auth controller load/sign-out helpers above the Supabase adapter.
- [x] DONE [HARD]: Added focused auth controller tests for unconfigured, authenticated, and sign-out states.
- [x] DONE [HARD]: Wired Profile screen focus loading to auth state without changing local profile persistence.
- [x] DONE [HARD]: Added auth status panel and refresh/sign-out actions for Profile account settings.
- [x] DONE [HARD]: Kept email/password form, account deletion backend work, sync, and support submission as future staged modules.

**Module: Supabase Auth Form Shell** - DONE
- [x] DONE [HARD]: Added auth controller helpers for sign-in, sign-up, and password recovery.
- [x] DONE [HARD]: Added `dictionairemobile://auth/callback` recovery redirect option.
- [x] DONE [HARD]: Added Profile account email/password form shell with sign-in, create-account, and recovery actions.
- [x] DONE [HARD]: Preserved unconfigured/local-first and no-local-data-delete behavior.
- [x] DONE [HARD]: Expanded focused auth tests to cover form action controller paths.

**Module: Supabase Auth Callback Route** - DONE
- [x] DONE [HARD]: Added callback controller handling for `code`, provider error, missing-code, and unconfigured states.
- [x] DONE [HARD]: Added Expo Router callback screen at `app/auth/callback.tsx`.
- [x] DONE [HARD]: Exchanged callback code for Supabase session through the auth adapter.
- [x] DONE [HARD]: Added focused callback tests without provider/network calls.
- [x] DONE [HARD]: Kept OAuth providers, account deletion, sync, and backend support submission out of scope.

**Module: Supabase Auth Session Refresh Lifecycle** - DONE
- [x] DONE [HARD]: Added Supabase auth lifecycle event mapping to app auth events.
- [x] DONE [HARD]: Added auth state-change subscription helper with cleanup.
- [x] DONE [HARD]: Added app foreground/background auto-refresh helper.
- [x] DONE [HARD]: Wired Profile to auth lifecycle and `AppState` changes.
- [x] DONE [HARD]: Added focused lifecycle tests without provider/network calls.

**Module: Supabase Auth Manual Smoke Prep** - DONE
- [x] DONE [HARD]: Added manual auth smoke prep doc with env and secret handling rules.
- [x] DONE [HARD]: Added Supabase Dashboard setup and redirect allow-list guidance.
- [x] DONE [HARD]: Added web/native/dev-client smoke matrix.
- [x] DONE [HARD]: Added local-first/no-data-delete smoke expectations.
- [x] DONE [HARD]: Added auth verification command list.

**Module: Current Decision Options Docs Sync** - DONE
- [x] DONE [HARD]: Added the current decision option summary, recommended defaults, and acceptance gates in `docs/current-decision-options.md`.
- [x] DONE [HARD]: Prepared Speech Scoring Engine options; Azure was later accepted in the Accepted Product Decisions Sync module.
- [x] DONE [HARD]: Prepared Language Source Gate options; chosen source-gate paths were later accepted while production adapters remain gated.
- [x] DONE [HARD]: Prepared support/feedback channel, auth token storage, and paid add-on/billing options; selected choices were later accepted.
- [x] DONE [HARD]: Preserved accepted foundations for Supabase, DeepL/OpenAI proxy, MLKit OCR, and OS/native STT.

**Module: Supabase Auth Foundation** - DONE
- [x] DONE [HARD]: Refreshed `.docs/decisions/auth-provider.md` as `Accepted` with Supabase Auth, Expo React Native integration notes, local-first account boundaries, and `docs/supabase-auth-foundation.md`.
- [x] DONE [HARD]: Defined Supabase session model, token storage policy, logout semantics, and local/offline fallback behavior without changing current local-only UI.
- [x] DONE [HARD]: Defined email/password/phone verification contract, account recovery expectations, and profile-field trust model for Supabase Auth.
- [x] DONE [HARD]: Defined account deletion contract across local SQLite data, future Supabase data, exports, and support/audit requirements.
- [x] DONE [HARD]: Acceptance gate met for future auth implementation planning; real login code now follows accepted `expo-secure-store` native token storage plus web fallback and still requires dependency install, adapter tests, and deep-link callback code.

**Module: Supabase Cloud Sync MVP** - DONE
- [x] DONE [HARD]: Refreshed `.docs/decisions/cloud-sync.md` and `docs/database-architecture-plan.md` with the completed Supabase Auth Foundation dependency and sync MVP scope.
- [x] DONE [HARD]: Defined Supabase sync table contract for profile, library folders, saved words, folder membership, search history, flashcards/reviews, reader documents/settings, tombstones, and per-entity timestamps/versions in `docs/supabase-cloud-sync-mvp.md`.
- [x] DONE [HARD]: Defined conflict strategy for local-first writes, remote updates, deletes/tombstones, offline queue replay, and last-writer/field-merge boundaries.
- [x] DONE [HARD]: Defined encrypted backup and restore UX as staged follow-up work that does not block a minimal sync MVP.
- [x] DONE [HARD]: Acceptance gate met for future cloud sync implementation planning; code still requires auth implementation/dependencies, SQL migrations with RLS, and local sync metadata.

**Module: Supabase Cloud Sync MVP Implementation Prep** - DONE
- [x] DONE [HARD]: Added `docs/supabase-cloud-sync-implementation-prep.md` for SQL/RLS, local metadata, adapter boundary, test, and manual smoke gates.
- [x] DONE [HARD]: Confirmed implementation starts with SQL/RLS migration draft and migration-shape tests before runtime sync code.
- [x] DONE [HARD]: Defined local metadata fields and per-domain cursors needed for dirty rows, tombstones, remote versions, and sign-out preservation.
- [x] DONE [HARD]: Defined fake Supabase client coverage for pull-before-push, offline/unconfigured states, retries, conflicts, and export compatibility.
- [x] DONE [HARD]: Kept realtime, encrypted backup, restore UX, and production sync enablement out of scope.

**Module: Supabase Cloud Sync SQL/RLS Migration Draft** - DONE
- [x] DONE [HARD]: Added first Supabase sync migration draft in `supabase/migrations/001_cloud_sync_mvp.sql`.
- [x] DONE [HARD]: Created all MVP sync tables with auth user ownership, preserved local ids, versions, timestamps, soft deletes, and tombstones.
- [x] DONE [HARD]: Enabled RLS and authenticated own-row CRUD policies for every MVP sync table.
- [x] DONE [HARD]: Added migration-shape tests in `tests/supabaseCloudSyncMigration.test.ts`.
- [x] DONE [HARD]: Left runtime sync, realtime, encrypted backup, restore UX, and production sync enablement for later modules.

**Module: Supabase Cloud Sync Local Metadata Draft** - DONE
- [x] DONE [HARD]: Added local sync domain constants for profile, folders, saved words, memberships, flashcards, reader, search history, and tombstones.
- [x] DONE [HARD]: Added sync status, remote version, last synced, and local change metadata columns to all local syncable tables.
- [x] DONE [HARD]: Added per-domain sync cursor table for future pull/push checkpoints.
- [x] DONE [HARD]: Added dirty-row indexes for folders, saved words, flashcards, and reader documents.
- [x] DONE [HARD]: Added schema-shape coverage in `tests/userDatabaseSyncMetadata.test.ts` without enabling runtime cloud sync.

**Module: Supabase Cloud Sync Mapper Contract Draft** - DONE
- [x] DONE [HARD]: Added `data/supabaseSyncMappers.ts` with pure row contracts for all MVP cloud sync domains.
- [x] DONE [HARD]: Added local-to-remote mapping with `user_id`, local ids, timestamps, versions, soft deletes, JSON tag arrays, and singleton ids.
- [x] DONE [HARD]: Added remote-to-local mapping for profile, library, history, flashcards, tombstones, and reader rows.
- [x] DONE [HARD]: Added focused mapper tests in `tests/supabaseSyncMappers.test.ts`.
- [x] DONE [HARD]: Left fake-client retries, real Supabase calls, runtime sync toggles, realtime, encrypted backup, and restore UX for later modules.

**Module: Supabase Cloud Sync Fake Client Contract** - DONE
- [x] DONE [HARD]: Added `data/supabaseSyncClient.ts` for fake-client/local-port sync orchestration.
- [x] DONE [HARD]: Added explicit availability result states for unconfigured, offline, signed-out, synced, and failed sync attempts.
- [x] DONE [HARD]: Added pull-before-push ordering, per-domain cursor recording, and mark-pushed behavior after successful pushes.
- [x] DONE [HARD]: Added fake-client tests in `tests/supabaseSyncClient.test.ts` for ordering, retry safety, unavailable states, and no-dirty domains.
- [x] DONE [HARD]: Left real Supabase calls, realtime, background jobs, encrypted backup, restore UX, and production sync toggles for later modules.

**Module: Supabase Cloud Sync Manual Smoke Prep** - DONE
- [x] DONE [HARD]: Added `docs/supabase-cloud-sync-manual-smoke.md` with auth dependency, disposable project, no-secret, and no-service-role rules.
- [x] DONE [HARD]: Documented SQL/RLS review gates for sync table coverage and own-row policies.
- [x] DONE [HARD]: Documented RLS cross-user probe matrix before runtime sync wiring.
- [x] DONE [HARD]: Documented two-device sync smoke script covering create, update, tombstone delete, sign-out, and re-sign-in.
- [x] DONE [HARD]: Documented failure, retry, rollback, and verification expectations without enabling production sync.

**Module: Supabase Cloud Sync Runtime Adapter Draft** - DONE
- [x] DONE [HARD]: Added `data/supabaseSyncRuntimeAdapter.ts` as the guarded real Supabase client port.
- [x] DONE [HARD]: Added unconfigured, offline, and signed-out availability checks before sync table operations.
- [x] DONE [HARD]: Added domain-to-table mapping and `updated_at` cursor pull behavior.
- [x] DONE [HARD]: Added authenticated upsert behavior with domain-specific conflict targets.
- [x] DONE [HARD]: Added focused runtime adapter tests without real Supabase network calls or UI wiring.

**Module: Supabase Cloud Sync Local Port Draft** - DONE
- [x] DONE [HARD]: Added `data/supabaseSyncLocalPort.ts` for local SQLite cursor, dirty-row, mark-pushed, and tombstone boundaries.
- [x] DONE [HARD]: Added per-domain cursor load/record helpers over `user_sync_cursors`.
- [x] DONE [HARD]: Added dirty-row discovery by sync status for profile, library, flashcards, reader, search history, memberships, and tombstones.
- [x] DONE [HARD]: Added pushed-row metadata cleanup and remote tombstone soft-delete application.
- [x] DONE [HARD]: Added focused local-port tests without wiring runtime sync into app lifecycle.

**Module: Supabase Cloud Sync Runner Wiring Draft** - DONE
- [x] DONE [HARD]: Added `data/supabaseSyncRunner.ts` to compose the sync runner, runtime adapter, and local SQLite port.
- [x] DONE [HARD]: Kept the default runner unconfigured until app wiring injects the real Supabase auth client factory.
- [x] DONE [HARD]: Added selected-domain and per-run clock override support for manual smoke paths.
- [x] DONE [HARD]: Added focused runner wiring tests in `tests/supabaseSyncRunner.test.ts`.
- [x] DONE [HARD]: Left UI, lifecycle/background sync, realtime, encrypted backup, restore UX, and production sync toggles for later modules.

**Module: Supabase Cloud Sync Manual Runtime Smoke Harness** - DONE
- [x] DONE [HARD]: Added `data/supabaseSyncSmokeHarness.ts` for explicit developer/manual sync smoke runs.
- [x] DONE [HARD]: Kept harness execution disabled by default and safe when no client boundary is injected.
- [x] DONE [HARD]: Added injected-port smoke run support for selected domains and deterministic clocks.
- [x] DONE [HARD]: Added focused harness tests in `tests/supabaseSyncSmokeHarness.test.ts`.
- [x] DONE [HARD]: Updated `docs/supabase-cloud-sync-manual-smoke.md` with harness guardrails.

**Module: Supabase Cloud Sync Production Toggle Decision Prep** - DONE
- [x] DONE [HARD]: Added `docs/supabase-cloud-sync-production-toggle-decision.md` for production sync UI/lifecycle gating.
- [x] DONE [HARD]: Documented remaining missing pieces before production sync can be exposed.
- [x] DONE [HARD]: Compared production toggle options and recommended Profile/Settings opt-in beta after manual smoke.
- [x] DONE [HARD]: Documented required product decisions for first surface, opt-in policy, states, domain scope, conflict detail, and failure reporting.
- [x] DONE [HARD]: Kept production sync UI/lifecycle implementation blocked until acceptance gates pass.

**Module: Supabase Cloud Sync Manual Smoke Execution Prep** - DONE
- [x] DONE [HARD]: Added `docs/supabase-cloud-sync-manual-smoke-execution.md` for real smoke execution order and local-only result capture.
- [x] DONE [HARD]: Documented required disposable-project inputs and no-secret rules.
- [x] DONE [HARD]: Added pass criteria for static verification, auth smoke, SQL/RLS probes, harness behavior, two-device sync, export, and rollback.
- [x] DONE [HARD]: Added failure handling rules that keep production sync blocked.
- [x] DONE [HARD]: Linked execution prep from the manual smoke guide.

**Module: DeepL + OpenAI Backend Proxy Env Guard Draft** - DONE
- [x] DONE [HARD]: Added backend-only env config reader in `backend/proxyConfig.ts`.
- [x] DONE [HARD]: Added allowed DeepL base URL and required DeepL/OpenAI key/model validation.
- [x] DONE [HARD]: Added quota/cost-control defaults for proxy usage.
- [x] DONE [HARD]: Added provider-unconfigured response mapping and safe structured log redaction.
- [x] DONE [HARD]: Added focused env/redaction tests in `tests/backendProxyConfig.test.ts`.

**Module: Google Sheets Export** - DONE
- [x] DONE [HARD]: Refreshed `.docs/decisions/google-sheets-export.md` with completed Supabase auth/backend/proxy foundations and `docs/google-sheets-export-mvp.md`.
- [x] DONE [HARD]: Defined backend-mediated Google OAuth route contract, scopes, token storage/revocation policy, and unsupported-platform behavior.
- [x] DONE [HARD]: Defined folder/export row contract from existing CSV/XLS/Anki payloads to spreadsheet rows, metadata, and sheet naming rules.
- [x] DONE [HARD]: Defined privacy/cost/error policy for partial export, retry, rate-limit, duplicate spreadsheet handling, and provider failure states.
- [x] DONE [HARD]: Acceptance gate met for future Google Sheets implementation planning; code still requires OAuth routes, encrypted token storage, row mapping tests, fake Google client tests, and local export regression checks.

**Module: MLKit OCR + OS/native STT Foundation** - DONE
- [x] DONE [HARD]: Refreshed `docs/voice-ocr-plan.md` with accepted MLKit OCR and OS/native speech-recognizer direction, current Expo SDK/native-module candidates, and dev-client constraints.
- [x] DONE [HARD]: Defined OCR/STT privacy, offline, accuracy, language coverage, app-size, permission, and unavailable-engine constraints without adding cloud recognition.
- [x] DONE [HARD]: Defined dev-client validation matrix for iOS, Android, Expo web fallback, permissions, unavailable-engine states, and artifact capture.
- [x] DONE [HARD]: Defined minimal recognition interfaces for OCR blocks and STT transcripts using the existing OCR engine and recognition contracts; kept phoneme alignment out of scope.
- [x] DONE [HARD]: Acceptance gate met for future native OCR/STT implementation planning; real OCR/STT can start after package install/dev-client spike is selected, while IPA/per-phoneme scoring is now staged behind the accepted Azure scoring path and backend/privacy/quota gates.

**Module: DeepL + OpenAI Backend Proxy MVP** - DONE
- [x] DONE [HARD]: Refreshed `.docs/decisions/translation-api.md` and `.docs/decisions/ai-chat-cost-control.md` with completed Supabase auth/sync foundations and `docs/deepl-openai-backend-proxy-mvp.md`.
- [x] DONE [HARD]: Defined backend proxy env policy, secret storage, request routing, quota/rate-limit model, privacy copy, and logging/redaction rules.
- [x] DONE [HARD]: Defined DeepL translation/glossary contract for text translation, specialized glossary use, unsupported language pairs, and error states.
- [x] DONE [HARD]: Defined OpenAI AI chat/voice-feedback contract for streaming, transcript handling, moderation, abuse controls, and user-visible usage limits.
- [x] DONE [HARD]: Acceptance gate met for future translation/AI implementation planning; code still requires backend routes, RLS tables, provider env vars, quota checks, and fake-provider tests.

**Module: Specialized Translation Dataset Agents** - TODO AFTER DEEPL/OPENAI PROXY
- [ ] TODO [HARD]: Define dataset upload/import contract for common formats: CSV/TSV, XLS/XLSX, TXT, Markdown, JSON, DOCX, and text-extractable PDF; scanned PDF/OCR remains separate.
- [ ] TODO [HARD]: Define editable dataset model: terms, phrases, source segments, translations, notes, tags, domain/topic, confidence, duplicate/conflict states, and revision history.
- [ ] TODO [HARD]: Define smart recognition/highlighting: match dataset terms/phrases in source text, show terminology chips, conflicts, missing translations, and suggested glossary candidates.
- [ ] TODO [HARD]: Define per-user context agents: max 3 active agents by default, each bound to one dataset/context; future extra agents require paid package/add-on decision.
- [ ] TODO [HARD]: Define editor modes: Word-like rich text, Google Docs-like collaborative-ready surface, LaTeX, Markdown, and plain text, with export/import boundaries and unsupported feature states.

**Module: Speech Scoring** - DONE DECISION PREP / AZURE ACCEPTED
- [x] DONE [HARD]: Refreshed `.docs/decisions/speech-scoring-engine.md` with current scoring/alignment candidates and clarified why OS/native STT does not satisfy scoring.
- [x] DONE [HARD]: Compared cloud pronunciation scoring APIs, on-device alignment options, custom backend pipelines, and manual playback-only fallback in `docs/speech-scoring-engine-plan.md`.
- [x] DONE [HARD]: Defined privacy, latency, language coverage, cost, retention, and raw-audio handling constraints.
- [x] DONE [HARD]: Defined minimal scoring interface for IPA alignment, per-phoneme rows, score history, and unavailable-engine UI states without fake scores.
- [x] DONE [HARD]: Acceptance gate updated: Azure AI Speech Pronunciation Assessment is accepted, while production scoring code remains staged until backend upload/proxy, quota, privacy, retention, first-language coverage, and fake-provider tests exist.

**Module: Language Source Gates** - DONE SOURCE-GATE PATHS ACCEPTED
- [x] DONE [HARD]: Refreshed Cantonese and Uyghur source status docs and added `docs/language-source-gates.md` for Cantonese, Uyghur, VI→FR, Basque, Ainu, Quechua, Nahuatl, and Guarani gates with explicit unavailable/research states.
- [x] DONE [HARD]: Compared source options for blocked languages/pairs: hosted APIs, Wiktionary/Kaikki/raw dumps, public-domain lists, national dictionaries, commercial licenses, and user-provided data.
- [x] DONE [HARD]: Defined source metadata and attribution requirements for any accepted fixture or production pack, including license, revision/dump date, source URL, user-visible label, and packaging obligations.
- [x] DONE [HARD]: Defined minimal adapter/readiness contract for candidates: script handling, morphology expectations, exact lookup, missing-result behavior, and blocked UI state.
- [x] DONE [HARD]: Acceptance gate updated: chosen source-gate paths are accepted, but each language or pair remains production-blocked until its dedicated source gate proves license, attribution, representative samples, and adapter readiness.

**Module: Accepted Lexical Source Follow-up** - DONE
- [x] DONE [MEDIUM]: Audit current Etymology and Conjugation UI/data paths against accepted `.docs/decisions/etymology-conjugation-source.md` and existing attribution behavior.
- [x] DONE [MEDIUM]: Define source-attribution contract for Wiktionary-derived etymology and UniMorph-style conjugation/paradigm data, including missing/partial source display.
- [x] DONE [MEDIUM]: Define live-data fallback behavior for unavailable etymology/conjugation sources without presenting mock data as production.
- [x] DONE [MEDIUM]: Add focused test expectations for attribution, missing source fallback, language coverage flags, and no-mock production states.
- [x] DONE [MEDIUM]: Keep offline/bulk packaging gated by accepted dictionary/offline licensing policy and separate ShareAlike pack packaging requirements.
- Result: `docs/etymology-conjugation-integration-plan.md` records the audit, contracts, fallback policy, test matrix, and packaging gate. Etymology/conjugation implementation can now move into a future `[ ] TODO` module that follows this plan.



## Rule

### Task Workflow
1. Trước khi bắt đầu module mới, kiểm tra code hiện tại và `docs/product-progress.md` đã đồng bộ: task đang làm/đã làm đúng trạng thái, `Next Work Module` phản ánh bước tiếp theo, và module có 3-5 task liên quan.
2. Khi bắt đầu một task trong `Next Work Module`, chuyển task đó sang `[~] IN PROGRESS` trong checklist tương ứng và trong module.
3. Sau khi triển khai xong, cập nhật checklist theo trạng thái thực tế của code: `[x]`, `[~]`, `[ ]`, hoặc `[!]`.
4. Trước mỗi commit, kiểm tra lại tiến độ code và `docs/product-progress.md` đã đồng bộ. Nếu commit hash chưa tồn tại, có thể cập nhật `Current Baseline` ngay sau commit code bằng một commit checklist kế tiếp.
5. Trước mỗi commit code, chạy kiểm tra xác minh theo verification ladder trong `docs/testing-and-build-guide.md`: `git diff --check`, `npx tsc --noEmit`, `npm run lint`, và focused/full test suite khi shared behavior, parser, adapter, hoặc store thay đổi. Nếu chỉ sửa tài liệu, vẫn ưu tiên chạy `git diff --check`, `npx tsc --noEmit`, và `npm run lint` trừ khi có blocker rõ ràng.
6. Commit code và checklist cùng nhau khi hợp lý. Nếu cần ghi commit hash mới vào `Current Baseline`, commit cập nhật checklist ngay sau commit code.
7. Trước mỗi lần push lên GitHub, kiểm tra lại `git status`, commit gần nhất, và `docs/product-progress.md` để đảm bảo code/checklist không lệch.
8. Sau khi push, kiểm tra `main` đã đồng bộ với `origin/main` và không còn thay đổi local chưa commit.
9. Sau khi checklist trên GitHub khớp với code thực tế và module hiện tại hoàn tất, mới tạo hoặc bắt đầu `Next Work Module` tiếp theo.

### Module Queue Rules
1. Mỗi `Next Work Module` phải có ít nhất 3 task và nhiều nhất 5 task liên quan; mặc định lập plan đủ 5 task khi còn đủ task hợp lệ.
2. Mỗi module phải có `Module Completion Plan` trước khi triển khai, và plan phải hướng đến hoàn thành cả module thay vì một task lẻ.
3. Các task chưa vào module vẫn phải giữ ở section checklist tương ứng, không xóa khỏi roadmap.
4. Ưu tiên task theo thứ tự dễ đến khó trong cùng module, trừ khi user chọn rõ một ưu tiên khác.
5. Sau khi một task trong module chuyển sang `[x] DONE`, giữ trạng thái đó trong module cho đến khi toàn bộ module hoàn tất; chỉ thay module mới khi tất cả task có thể làm ngay đã DONE hoặc blocker đã được ghi rõ.
6. Không kéo task `[!] BLOCKED` vào module như việc có thể làm ngay. Nếu task trong module phát sinh blocker và module còn dưới 3 task có thể làm ngay, thay bằng task liên quan hợp lệ trước commit kế tiếp.

### Language Build Rules
1. Trước khi build một ngôn ngữ mới, xác định language family/typology của ngôn ngữ đó và ghi vào `Language Family Roadmap`.
2. Nếu family/typology đó đã có ngôn ngữ được build trong hệ thống, so sánh ngôn ngữ mới với các baseline đã build trong cùng family trước: script, writing direction, segmentation, morphology, pronunciation/IPA, romanization, gender/case/tone/classifier/noun class, dictionary source, và UI/search implications.
3. Nếu family/typology đó chưa có ngôn ngữ nào được build, research và phân tích đặc điểm ngôn ngữ trước để tạo baseline đầu tiên cho family đó, rồi mới lập plan implement.
4. Khi build một ngôn ngữ mới, luôn build từ điển tra cứu trong cùng ngôn ngữ trước (monolingual: `lang -> lang`) với definition, part of speech, pronunciation/IPA/audio nếu có, và các field đặc thù của ngôn ngữ đó. Chỉ sau khi monolingual lookup ổn mới mở bilingual dictionary từ/ngôn ngữ đó sang các ngôn ngữ đã build trong hệ thống.
5. Bilingual dictionary giữa hai ngôn ngữ phải dùng nguồn dictionary/lexical source đáng tin; không dùng machine translation để giả lập definition từ điển.
6. Với các nhóm gây tranh luận như Altaic hoặc Amerind, chỉ dùng như bucket kỹ thuật/roadmap; không coi là taxonomy production khi thiết kế dữ liệu.
