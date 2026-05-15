# Blocked Decisions

## Decision Docs
Decision records live in `.docs/decisions/`.

Current decision docs are all `Proposed` unless edited:
- `.docs/decisions/auth-provider.md`
- `.docs/decisions/backend-architecture.md`
- `.docs/decisions/cloud-sync.md`
- `.docs/decisions/dictionary-source-licensing.md`
- `.docs/decisions/speech-scoring-engine.md`
- `.docs/decisions/ai-chat-cost-control.md`
- `.docs/decisions/translation-api.md`
- `.docs/decisions/offline-dictionary-bundle.md`

## Rule
Treat `Proposed` as still blocked. Production implementation may proceed only when the relevant decision is explicitly accepted or the user gives a scoped implementation instruction.

## Blocked Areas

### Auth Provider
Blocked:
- Email login
- Password changes
- Email/phone verification
- Account deletion
- Real sign out

Allowed:
- Local UI placeholder
- Decision document
- Interface planning

### Backend Architecture
Blocked:
- Feedback submission
- Server-side account workflows
- AI/translation proxy
- Shared user data storage

Allowed:
- Frontend shell
- API contract draft
- Decision document

### Cloud Sync
Blocked:
- Cloud backup
- Cross-device sync
- Encrypted backup

Allowed:
- Local export
- Conflict strategy document
- Data model planning

### Google Sheets Export
Blocked:
- Real Google Sheets export
- OAuth flow
- Google API writes

Allowed:
- Disabled UI state
- Export copy
- Decision document

### Speech Scoring
Blocked:
- IPA comparison scoring
- Per-phoneme scoring
- Alignment table

Allowed:
- Recording playback
- UI shell
- Engine comparison decision

### AI Chatbot And Translation
Blocked:
- Real-time AI conversation
- Persistent AI memory
- Production translation
- Specialized document translation with glossary

Allowed:
- Frontend shell
- Prompt planning
- Cost-control and translation API decisions

### Dictionary Data Licensing
Blocked:
- Licensed offline dictionary bundle
- Production etymology data
- Production conjugation data

Allowed:
- Source research
- Adapter planning
- Decision document
