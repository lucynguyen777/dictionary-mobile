# Dictionary Mobile

Local-first Expo Router app (iOS/Android/Web) for dictionary lookup, saved vocabulary, flashcards (SM-2), Reader, and import/export. Optional backend: Supabase Auth + Cloud Sync, Vercel `/backend-proxy` (DeepL, OpenAI, Google Sheets, feedback), Chandra OCR service.

## Read first
- `docs/product-progress.md`: the canonical roadmap and checklist. Don't start `[!] BLOCKED` tasks, and keep `Next Work Module` to 5 or fewer active tasks.
- `docs/completion-plan.md`: the audit (2026-10) and phased plan to full feature completion.
- `.ai/context/product-rules.md`: implementation, verification, security, and documentation rules.
- `.ai/context/blocked-decisions.md`: which provider/source decisions are accepted vs blocked.
- `DESIGN.md`: UI rules. Use the `constants/theme.ts` tokens via `useToken`, with no hex literals in screens. Use the 4px grid and a 40px minimum target. Support dark mode and reduced motion.

## Layout
- `app/`: Expo Router screens. `(tabs)` holds index, word, library, advanced, profile, and the hidden ai-assistant tab; `reader.tsx` and `folder/[id].tsx` sit outside the tabs.
- `components/`: shared UI. `components/app` holds primitives (Screen, LanguageSelect, FutureFeature, MotionPressable…); feature folders (`word`, `word/tabs`, `library`, `training`, `profile`, `reader`) hold screen parts split out of the route files.
- `data/`: stores, the SQLite runtime, dictionary adapters and morphology, sync, OCR, and auth. `.web.ts` and `.native.ts` provide platform splits.
- `backend/` + `api/backend-proxy.ts`: an Express app served as a Vercel function.
- `supabase/migrations/`: SQL with RLS. Every new table needs RLS and owner-scoped policies.
- `tests/`: vitest. `e2e/`: Playwright on Expo web. `.maestro/`: native smoke.

## Commands
```bash
npx tsc --noEmit
npm run lint
npm test -- --run                      # full unit suite
npm test -- --run tests/<file>.test.ts # focused
npm run test:e2e                       # Playwright (Expo web)
npm run web                            # dev server
```
Run `git diff --check`, `tsc`, and `lint` before every commit. Also run the unit tests when changing `data/`, `backend/`, parsers, adapters, or stores.

## Hard rules
- Core features must keep working with no Supabase or backend configured.
- Never use machine translation as dictionary data. Every lexical source needs license and attribution metadata.
- No secrets in client code or `EXPO_PUBLIC_*` vars. Provider keys stay in Vercel server env only.
- Don't present fixture or mock data as production behavior. Hide or mark unavailable features honestly.
- Update `docs/product-progress.md` after implementation so the checklist matches the code.

## Project skills
`.claude/skills/*` wrap the shared playbooks in `.ai/skills/`, and `.ai/agents/` holds the role specs. Edit the `.ai/` originals, not the wrappers.
