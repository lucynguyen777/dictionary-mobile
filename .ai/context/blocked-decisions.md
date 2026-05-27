# Blocked Decisions

Use `docs/product-progress.md` as the source of truth for the full roadmap. This file separates accepted, staged-after-dependency, and still-blocked work so agents can plan safely without implementing features whose provider/source/API/backend decision is not accepted.

## Supabase Auth Foundation
Status: Foundation completed in `docs/supabase-auth-foundation.md`; real auth implementation can move to a staged TODO module.

Accepted:
- Supabase Auth provider
- Supabase-backed account identity
- Email/password auth direction
- Real sign out direction
- Account deletion direction through Supabase account/backend support

Allowed preparatory work:
- Follow `docs/supabase-auth-foundation.md`
- Use the existing `dictionairemobile` scheme and allow-list `dictionairemobile://**` before email confirmation/recovery flows
- Keep Supabase client access behind an auth adapter and public Expo env vars
- Preserve local/offline fallback behavior while auth is unconfigured, offline, or signed out
- Keep existing local UI placeholders clearly marked as local/coming soon

Acceptance gate:
- Real email login, verification, sign out, and account deletion can move into an implementation module once dependencies and token storage choice are added.

---

## Supabase Cloud Sync MVP
Status: Foundation completed in `docs/supabase-cloud-sync-mvp.md`; cloud sync implementation can move to a staged TODO module after auth dependencies are installed.

Accepted:
- Supabase backend architecture
- Supabase sync tables direction
- Local-first sync with existing SQLite ids, timestamps, versions, and tombstones
- Backend-backed account deletion direction

Allowed preparatory work:
- Follow `docs/supabase-cloud-sync-mvp.md`
- Keep RLS enabled on sync tables and scope rows with `auth.uid() = user_id`
- Preserve existing local SQLite ids, timestamps, versions, and tombstones
- Keep encrypted backup/restore UX as staged follow-up work
- Keep offline dictionary packs out of sync MVP scope

Acceptance gate:
- Cloud sync code may start after auth implementation/dependencies exist, SQL migrations are added, and local sync metadata is introduced.

---

## Google Sheets Export
Status: Foundation completed in `docs/google-sheets-export-mvp.md`; implementation can move to a staged code module after backend OAuth routes, token storage, and fake Google client tests are added.

Accepted/staged:
- Real Google Sheets export
- Token-backed spreadsheet sync
- Spreadsheet creation/update through backend-mediated Google OAuth

Allowed preparatory work:
- Follow `docs/google-sheets-export-mvp.md`
- Prefer least-privilege `drive.file` scope and add `spreadsheets` only if required
- Keep Google refresh tokens server-side and encrypted/tokenized
- Reuse existing folder export columns: word, ipa, definition, note, folder, tags, createdAt
- Keep CSV/XLS/Anki and manual CSV upload fallback available

Acceptance gate:
- Implementation may start after OAuth state validation, token revocation, row mapping, provider retry, and partial export behavior are covered by tests.

---

## MLKit OCR + OS/native STT Foundation
Status: Foundation completed. MLKit OCR and OS/native STT are accepted directions; speech scoring remains blocked.

Accepted:
- MLKit Text Recognition wrapper direction for OCR
- OS/native speech recognizer direction for STT
- Dev-client validation requirement

Still blocked implementation:
- IPA comparison
- Per-phoneme scoring
- Phoneme alignment table
- Production pronunciation scoring history

Allowed preparatory work:
- Follow the completed foundation in `docs/voice-ocr-plan.md`
- Use `@infinitered/react-native-mlkit-text-recognition` v5.x as the first OCR spike candidate for Expo SDK 54
- Use `expo-speech-recognition` as the first OS/native STT spike candidate
- Keep native packages behind OCR/STT adapter contracts and deterministic fallbacks
- Keep cloud recognition and phoneme scoring out of scope until separately accepted

Acceptance gate:
- Future real OCR/STT implementation may start as a separate native spike module; IPA/per-phoneme scoring remains blocked until a scoring engine is accepted.

---

## DeepL + OpenAI Backend Proxy MVP
Status: Foundation completed in `docs/deepl-openai-backend-proxy-mvp.md`; translation/AI implementation can move to staged code modules after backend routes, RLS tables, and provider env vars are added.

Accepted:
- DeepL translation and glossary support through backend proxy
- OpenAI AI chat/voice feedback through backend proxy
- Quotas, rate limits, privacy policy, and cost controls as required backend contracts

Allowed preparatory work:
- Follow `docs/deepl-openai-backend-proxy-mvp.md`
- Keep DeepL and OpenAI keys server-side only
- Add quota checks before provider calls
- Redact source text, translations, prompts, transcripts, glossary entries, and provider keys from logs by default
- Keep machine translation output out of dictionary/source data

Acceptance gate:
- Implementation may start after backend proxy routes, RLS-protected usage/glossary tables, env vars, and fake-provider tests are added.

---

## Specialized Translation Dataset Agents
Status: Staged TODO after DeepL/OpenAI proxy foundation. Production implementation is blocked until backend storage, parser validation, quota, privacy, and no-key-leak tests are defined.

Accepted direction:
- User-uploaded specialized translation datasets
- Editable dataset rows/terms/segments
- Smart term/phrase recognition and highlighting
- Dataset-grounded context agents, not model fine-tuning
- Maximum 3 active agents per user by default
- Future paid packages/add-ons can raise the limit after a billing decision

Allowed preparatory work:
- Follow `docs/deepl-openai-backend-proxy-mvp.md`
- Define dataset upload/import contracts for CSV/TSV, XLS/XLSX, TXT, Markdown, JSON, DOCX, and text-extractable PDF
- Define editor modes for Word-like rich text, Google Docs-like surfaces, LaTeX, Markdown, and plain text
- Keep scanned PDFs/OCR extraction out of scope until OCR implementation exists
- Keep provider keys server-side and redact raw dataset content from logs by default

Acceptance gate:
- Implementation may start after parser fixtures, dataset validation, highlighting behavior, max-3-agent enforcement, RLS tables, quota checks, and fake-provider no-key-leak tests are planned.

---

## Language Source Gates
Status: Foundation refreshed in `docs/language-source-gates.md`; still blocked per language/pair until an approved lexical source exists.

Still blocked implementation:
- Cantonese monolingual definitions
- Uyghur monolingual baseline implementation
- VI->FR bilingual dictionary source
- Basque/Ainu/Amerind-family language implementation without source research
- Any bilingual dictionary that would rely on machine translation as dictionary data

Allowed preparatory work:
- Follow `docs/language-source-gates.md`
- Create dedicated source gate docs for VI->FR, Basque, Ainu, Quechua, Nahuatl, or Guarani before implementation
- Compare hosted APIs, Wiktionary/Kaikki/raw dumps, public-domain lists, national dictionaries, commercial licenses, and user-provided data
- Preserve source metadata, attribution, script/morphology requirements, and adapter readiness contracts
- Keep machine translation output out of dictionary/source data

Acceptance gate:
- The specific language or pair has an approved full-definition or bilingual lexical source.

---

## Accepted Lexical Source Follow-up
Status: Planning completed; implementation can be selected as a future TODO module using `docs/etymology-conjugation-integration-plan.md`.

Still blocked implementation:
- Offline/bulk etymology or conjugation packaging without ShareAlike-compatible pack review
- Mock etymology/conjugation presented as production data

Allowed preparatory work:
- Follow `docs/etymology-conjugation-integration-plan.md`
- Add structured etymology source metadata without removing current fallbacks
- Add UniMorph-style paradigm fixtures only with source/license metadata
- Preserve no-mock production behavior and offline/bulk packaging gates

Acceptance gate:
- Future implementation module may move to `[ ] TODO` when it follows the documented attribution, fallback, fixture, test, and packaging-gate contract; offline/bulk packaging still follows dictionary/offline licensing gates.
