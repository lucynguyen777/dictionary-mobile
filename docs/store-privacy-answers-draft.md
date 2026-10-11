# Store Privacy Answers: Draft from the Code (plan 7.3)

Draft answers for Apple's App Privacy ("nutrition label") and Google Play's Data safety form. They are derived from what the code actually sends off the device (inventory below, 2026-10-11). The owner still needs to confirm them together with the Privacy Policy (D5), crash reporting (D8) and account deletion (D3). Re-check this file whenever a network call is added.

## What leaves the device

| Feature | Data | Destination | When |
| --- | --- | --- | --- |
| Account (optional) | Email, password (to Supabase Auth only), Supabase user id | Supabase Auth | Sign-up/sign-in |
| Cloud Sync (opt-in) | Profile, library folders, saved words, search history, flashcards and review state, Reader documents and settings, deletions (`supabase/migrations/001_cloud_sync_mvp.sql`); Specialized Translation glossaries, sentence pairs and agent presets (`user_glossaries`, `translation_datasets`, `translation_context_agents`) | Supabase (Postgres with owner-only RLS) | When Cloud Sync is on |
| Translation (Word/Reader) | Text to translate, language pair | Backend proxy (Vercel) → DeepL | User taps translate; requires sign-in |
| Specialized Translation | Text, glossary terms that occur in it, up to 5 similar sentence pairs, domain, tone | Backend proxy → OpenAI | User taps translate; requires sign-in |
| AI Tutor | Chat messages, learning goal, languages | Backend proxy → OpenAI | User sends a message; requires sign-in |
| Quota | User id, daily counters | Supabase `proxy_quota_counters` (server only) | Each proxied request |
| Feedback | Category, message, app context string | Backend proxy → Supabase `feedback` | User submits the form |
| Google Sheets export (optional) | Saved words of a folder; Google OAuth refresh token (encrypted, server only) | Backend proxy → Google Sheets API | User connects Google and exports |
| Scanned PDF OCR (when configured) | The PDF file | Chandra OCR service (`EXPO_PUBLIC_CHANDRA_OCR_URL`), authenticated with the Supabase session | User imports a scanned PDF |
| Dictionary lookup | The looked-up word, plus the IP address any request carries | Third-party dictionary APIs: dictionaryapi.dev, api.wiktapi.dev, api.datamuse.com, dict.minhqnd.com | Each online lookup (offline packs need none) |
| Pronunciation audio | Audio file request | ssl.gstatic.com and Wikimedia Commons | User taps play |
| PDF reader library | Library download (no user data) | cdn.jsdelivr.net, unpkg.com | First PDF import on a device |
| Profile picture | Image request | Whatever URL the user enters as their picture (the default is a local placeholder) | Profile screen |

Stays on the device:
- Camera OCR runs on-device (MLKit). Images are never uploaded.
- Voice search uses the operating system's speech recognizer. Audio goes to Apple or Google only under their own terms when the OS does not recognize on-device; the app never receives or stores it.
- Offline packs and the local SQLite database stay on the device unless Cloud Sync is on.
- There is no analytics or advertising SDK and no tracking across apps.
- No crash reporting is wired yet (D8). If one is added, Diagnostics must be declared.

## Apple App Privacy (draft)

- **Data used to track you:** none.
- **Data linked to you** (only for users who create an account):
  - Contact Info → Email Address, for App Functionality.
  - Identifiers → User ID, for App Functionality.
  - User Content → Other User Content (synced learning data, glossaries, feedback, text sent for translation or AI), for App Functionality. Product Interaction is not collected.
- **Data not linked to you:** none beyond the above. Third-party dictionary APIs receive the looked-up word without any identifier.
- **Not collected:** Location, Contacts, Health, Financial, Browsing History, Search History (kept on the device unless synced, then linked as User Content), Purchases, Diagnostics (until D8), Audio and Photos (processed on-device or by the OS).

## Google Play Data safety (draft)

- **Data collected:**
  - Personal info → Email address: required for an account, account management.
  - Personal info → User IDs.
  - App activity → Other user-generated content (synced learning data, glossaries, feedback, text for translation or AI): app functionality, optional.
- **Data shared with third parties:** none for advertising or analytics. DeepL, OpenAI, Google Sheets and the dictionary APIs act on the user's request as service providers.
- **Security:** all traffic uses HTTPS. Provider keys stay on the server.
- **Deletion:** users can request deletion. The in-app flow and the deletion URL depend on D3.

## Gaps to close before submission

- Privacy Policy and Terms URLs (D5) and the account-deletion URL (D3).
- Update this file when crash reporting (D8) or Azure pronunciation scoring (D6) lands.
