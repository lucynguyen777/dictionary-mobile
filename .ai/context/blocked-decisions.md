# Blocked Decisions

Use `docs/product-progress.md` as the source of truth for the full roadmap. This file separates accepted, staged-after-dependency, and still-blocked work so agents can plan safely without implementing features whose provider/source/API/backend decision is not accepted.

## Accepted Current Decisions
Status: Product-owner choices from `docs/current-decision-options.md` have been recorded.

Accepted:
- Speech scoring engine: Azure AI Speech Pronunciation Assessment.
- Language source-gate paths: Words.hk permission path for Cantonese, curated `ug.wiktionary.org` for Uyghur, DBnary/Wiktionary VI->FR extraction, and Wiktionary/Kaikki for Basque, Ainu, Quechua, Nahuatl, and Guarani.
- Support/feedback channel: Supabase feedback table plus Resend backend email notification.
- Auth token storage: Expo SecureStore on native plus web fallback.
- Paid add-ons for extra AI agents: keep `maxAgentsPerUser = 3`; no billing in MVP.

Guardrail:
- Accepted source-gate paths are not production lexical-source approvals. Do not implement language adapters/fixtures until the dedicated source gate proves license, attribution, representative samples, and adapter readiness.
- Do not implement production Azure scoring until backend upload/proxy, quota, privacy, retention, account deletion behavior, first-language coverage smoke, and fake-provider tests exist.
- Do not implement paid extra-agent purchase flows in MVP.

---

---

## Supabase Auth Foundation
Status: Fully implemented. Native token storage (SecureStore), adapter logic, custom callback routes, user form interfaces, and dynamic auth lifecycle hooks are active in production.

Accepted:
- Supabase Auth provider
- Supabase-backed account identity
- Email/password auth direction
- Real sign out direction
- Account deletion direction through Supabase account/backend support

---

## Supabase Cloud Sync MVP
Status: Fully implemented. Realtime sync runner, SQLite data ports, tombstones, and data mappers synchronizing user profiles, vocabulary folders, saved words, memberships, search history, and flashcard schedules with conflict resolution are fully functional.

Accepted:
- Supabase backend architecture
- Supabase sync tables direction
- Local-first sync with existing SQLite ids, timestamps, versions, and tombstones
- Backend-backed account deletion direction

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
Status: Foundation completed. MLKit OCR and OS/native STT are accepted directions; pronunciation scoring is staged separately behind the accepted Azure scoring decision and backend/privacy/quota gates.

Accepted:
- MLKit Text Recognition wrapper direction for OCR
- OS/native speech recognizer direction for STT
- Dev-client validation requirement

Out of OCR/STT scope:
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
- Future real OCR/STT implementation may start as a separate native spike module; IPA/per-phoneme scoring belongs to the Azure scoring module and remains gated by backend upload, privacy, retention, quota, first-language coverage, and fake-provider tests.

---

## DeepL + OpenAI Backend Proxy MVP
Status: Implemented and wired for v1.2.2 through the Vercel `/backend-proxy` function. Users can translate definitions or reader highlight selections via DeepL, and converse, correct, or roleplay with the AI Tutor screen via OpenAI backend proxy when Supabase auth and provider env vars are configured. Quota limits are enforced server-side.

Accepted:
- DeepL translation and glossary support through backend proxy
- OpenAI AI chat/voice feedback through backend proxy
- Quotas, rate limits, privacy policy, and cost controls as required backend contracts

Allowed preparatory work:
- Follow `docs/deepl-openai-backend-proxy-mvp.md`
- Keep DeepL and OpenAI keys server-side only
- Keep backend env validation and redacted logging tests in place
- Keep user-provided API keys backend-only and encrypt them before persistence
- Bind encrypted user-provider secrets to user id, provider, purpose, and key version
- Validate translation, glossary, AI chat, voice feedback, and provider-connection requests before route/provider work
- Add quota checks before provider calls
- Redact source text, translations, prompts, transcripts, glossary entries, and provider keys from logs by default
- Keep machine translation output out of dictionary/source data

Acceptance gate:
- Production provider calls require Vercel env vars, Supabase auth redirect allow-list, backend proxy smoke, quota checks, RLS-protected usage/glossary/provider-connection tables, encrypted-secret no-key-leak tests, and fake-provider tests.

---

## Specialized Translation Dataset Agents
Status: Staged TODO after DeepL/OpenAI proxy foundation. User-provider secret encryption foundation is available, but production implementation is blocked until backend storage, parser validation, quota, privacy, and no-key-leak tests are defined.

Accepted direction:
- User-uploaded specialized translation datasets
- Editable dataset rows/terms/segments
- Smart term/phrase recognition and highlighting
- Dataset-grounded context agents, not model fine-tuning
- User-provided provider API keys can be attached only through encrypted backend storage
- Maximum 3 active agents per user by default
- Future paid packages/add-ons can raise the limit after a billing decision

Allowed preparatory work:
- Follow `docs/deepl-openai-backend-proxy-mvp.md`
- Follow `.docs/decisions/paid-ai-agent-addons.md`; max 3 active agents is accepted for MVP and billing is deferred.
- Define dataset upload/import contracts for CSV/TSV, XLS/XLSX, TXT, Markdown, JSON, DOCX, and text-extractable PDF
- Define editor modes for Word-like rich text, Google Docs-like surfaces, LaTeX, Markdown, and plain text
- Keep scanned PDFs/OCR extraction out of scope until OCR implementation exists
- Keep app-owned and user-provided provider keys server-side, encrypted when persisted, and redact raw dataset content from logs by default

Acceptance gate:
- Implementation may start after parser fixtures, dataset validation, highlighting behavior, max-3-agent enforcement, RLS tables, encrypted provider-connection tables, quota checks, and fake-provider no-key-leak tests are planned. Paid extra-agent implementation remains blocked by the MVP no-billing decision.

---

## Speech Scoring
Status: Azure AI Speech Pronunciation Assessment is accepted in `.docs/decisions/speech-scoring-engine.md`; implementation is staged until backend/privacy/quota/testing gates are defined.

Staged implementation:
- Azure-backed IPA comparison when provider output can be aligned with source-backed IPA.
- Per-phoneme scoring from provider output only.
- Pronunciation feedback table.
- Speech practice score history with metadata-only default retention.
- Visual pronunciation guidance using provider-backed rows only.

Allowed preparatory work:
- Follow `docs/speech-scoring-engine-plan.md`
- Follow `.docs/decisions/speech-scoring-engine.md`; Azure is accepted for first implementation path.
- Keep Speechace, custom backend alignment, and manual playback-only fallback documented as deferred/fallback options.
- Keep Google Cloud STT and OS/native STT classified as transcription only, not scoring
- Define raw-audio privacy, retention, quota, and unavailable-engine UI states
- Keep recording playback honest while scoring is blocked

Acceptance gate:
- Pronunciation scoring code can start only after backend upload path, first-language coverage, raw-audio retention policy, quota model, account deletion behavior, and fake-provider scoring tests are defined.

---

## Language Source Gates
Status: Source-gate paths are accepted in `docs/language-source-gates.md`; production dictionary implementation is still blocked per language/pair until the chosen path passes its dedicated source gate.

Still blocked implementation:
- Cantonese monolingual definitions
- Uyghur monolingual baseline implementation
- VI->FR bilingual dictionary source
- Basque/Ainu/Amerind-family language implementation without source research
- Any bilingual dictionary that would rely on machine translation as dictionary data

Allowed preparatory work:
- Follow `docs/language-source-gates.md`
- Follow the accepted path per language/pair in `docs/current-decision-options.md`.
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
