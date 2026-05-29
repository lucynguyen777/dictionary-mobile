# Product Rules

## Progress Rule
Before starting any task:
1. Read docs/product-progress.md.
2. Check that the task status is correct.
3. Do not start tasks marked BLOCKED.
4. Do not keep DONE tasks inside the active Next Work Queue.
5. Keep Next Work Queue to maximum 5 active tasks.

## Implementation Rule
Prefer small, complete, verifiable changes.

Do not make unrelated refactors unless required.

## Verification & Security Rule
Before marking a task DONE or committing/pushing, run:

```bash
git diff --check
npx tsc --noEmit
npm run lint
```

Furthermore, you must actively inspect changes for security risks, vulnerabilities, and credentials leakage:
1. **No Client-Side Secrets**: Never commit or push hardcoded API keys, tokens, or credentials.
2. **Row Level Security (RLS)**: Verify all new database tables in migrations have RLS enabled and proper ownership-scoped policies.
3. **Input Sanitation & Limits**: Validate that file parsers (like PDF/EPUB/DOCX) and APIs have strict size boundaries to prevent memory exhaust/denial of service.
4. **Credential/Token Storage**: Verify that sensitive tokens are stored in secure native storage (e.g. Keychain via SecureStore) rather than unencrypted storage.

If verification fails or there are active unmitigated security risks, the task must not be marked DONE.

## Documentation Rule

After implementation:

1. Update docs/product-progress.md.
2. Sync checklist status with code reality.
3. Update Next Work Queue if needed.
4. Suggest a commit message.

## Blocked Task Rule

Do not implement real behavior for features that require unresolved backend, auth, API, OAuth, speech, AI, or licensing decisions.

For BLOCKED tasks, only create:

* decision docs
* frontend placeholder UI
* interface contracts
* implementation plans
