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
Status: Accepted direction; implementation is staged after Supabase Auth Foundation.

Accepted:
- Supabase backend architecture
- Supabase sync tables direction
- Local-first sync with existing SQLite ids, timestamps, versions, and tombstones
- Backend-backed account deletion direction

Allowed preparatory work:
- Refresh `.docs/decisions/backend-architecture.md` and `.docs/decisions/cloud-sync.md` as `Accepted`
- Define sync conflict strategy for profile, library, flashcards, reader, tombstones, and offline behavior
- Define encrypted backup/restore UX as staged follow-up work
- Define minimal Supabase sync API/data contract using existing local ids, timestamps, versions, and tombstones

Acceptance gate:
- Implementation may start after Supabase Auth Foundation is ready and local SQLite sync contract is documented.

---

## Google Sheets Export
Status: Staged after dependency; backend-mediated Google OAuth direction is selected, but implementation waits for Supabase auth/backend foundation.

Staged after dependency:
- Real Google Sheets export
- Token-backed spreadsheet sync
- Spreadsheet creation/update through backend-mediated Google OAuth

Allowed preparatory work:
- Create `.docs/decisions/google-sheets-export.md` as `Accepted` for backend-mediated Google OAuth
- Define manual CSV upload fallback and local-only status quo
- Define scopes, token storage, revocation, rate-limit, retry, and unsupported-platform behavior
- Define row/export contract from existing local folder exports

Acceptance gate:
- Implementation may start after Supabase Auth Foundation and backend proxy policies are documented.

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
Status: Accepted direction; implementation is staged after Supabase auth/backend foundation.

Accepted:
- DeepL translation and glossary support through backend proxy
- OpenAI AI chat/voice feedback through backend proxy
- Quotas, rate limits, privacy policy, and cost controls as required backend contracts

Allowed preparatory work:
- Refresh `.docs/decisions/translation-api.md` and `.docs/decisions/ai-chat-cost-control.md` as `Accepted`
- Define glossary persistence, streaming, privacy, moderation, rate-limit, and cost-control contracts
- Define backend proxy env policy and user-visible limits

Acceptance gate:
- Implementation may start after Supabase Auth Foundation, backend proxy env policy, quota model, and privacy copy are documented.

---

## Language Source Gates
Status: Blocked per language/pair until an approved lexical source exists.

Still blocked implementation:
- Cantonese monolingual definitions
- Uyghur monolingual baseline implementation
- VI->FR bilingual dictionary source
- Basque/Ainu/Amerind-family language implementation without source research
- Any bilingual dictionary that would rely on machine translation as dictionary data

Allowed preparatory work:
- Refresh Cantonese, Uyghur, VI->FR, Basque, Ainu, Quechua, Nahuatl, and Guarani source status docs
- Compare hosted APIs, Wiktionary/Kaikki/raw dumps, public-domain lists, national dictionaries, commercial licenses, and user-provided data
- Define source metadata, attribution, script/morphology requirements, and adapter readiness contracts

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
