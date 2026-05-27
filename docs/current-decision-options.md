# Current Decision Options

## Goal

Prepare the remaining product-owner decisions with at least three realistic options each. This document does not accept any provider, source, billing model, support channel, or token storage implementation by itself.

Accepted foundations remain accepted:

- Supabase Auth/backend/cloud direction;
- DeepL translation and OpenAI AI features through backend proxy;
- MLKit OCR direction;
- OS/native STT direction.

## Decision Summary

| Decision | Current status | Recommended default | Implementation status |
| --- | --- | --- | --- |
| Speech scoring engine | Proposed | Azure AI Speech Pronunciation Assessment for MVP if cloud audio is accepted | Still blocked |
| Language source gates | Per-language blocked/research gates | Choose one source gate at a time, starting with strongest legal source evidence | Still blocked per language/pair |
| Support/feedback channel | Not accepted | Supabase feedback table plus Resend backend email notification | Still blocked |
| Auth token storage | Not accepted | Hybrid adapter: SecureStore on native, AsyncStorage/localStorage fallback on web/dev | Blocks real auth code |
| Paid add-ons for extra AI agents | Not accepted | Keep max 3 free; choose RevenueCat later for mobile subscriptions or Stripe later for web/backend billing | Billing still blocked |

## Speech Scoring Engine

| Option | Fit | Pros | Constraints | Recommendation |
| --- | --- | --- | --- | --- |
| Azure AI Speech Pronunciation Assessment | Cloud pronunciation scoring API | Provider-backed pronunciation, fluency, completeness, word/syllable/phoneme-level assessment in Microsoft docs | Requires cloud audio upload, backend proxy, quota, retention policy, and language coverage smoke | Best MVP default if cloud audio is acceptable |
| Speechace Pronunciation Scoring API | Specialist pronunciation assessment API | Purpose-built word, syllable, and phoneme scoring endpoints | Third-party vendor terms, pricing, retention, latency, and backend upload path must be accepted | Strong alternative if specialist scoring quality/pricing wins |
| Custom MFA/Kaldi-style backend | Self-managed forced-alignment research path | More control and possible offline/server-side ownership | Heavy model/dictionary pipeline; forced alignment does not provide learner scoring alone | Research only, not first MVP |

Decision needed:

- Pick one scoring engine for the first target language.
- Accept raw-audio privacy copy, retention default, account deletion behavior, and quota limits.
- Define fake-provider scoring tests before production UI shows scores.

Acceptance gate:

- `.docs/decisions/speech-scoring-engine.md` changes from `Proposed` to `Accepted`, with the chosen engine and first-language coverage recorded.

Sources:

- Microsoft Learn: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment
- Speechace API docs: https://api-docs.speechace.com/api-reference/score-text-pronunciation
- Montreal Forced Aligner docs: https://montreal-forced-aligner.readthedocs.io/en/v3.2.3/user_guide/index.html

## Language Source Gates

Keep each language or pair independent. Do not use an "Amerind" bucket as production taxonomy, and do not use machine translation output as dictionary data.

### Cantonese `yue -> yue`

| Option | Fit | Pros | Constraints | Recommendation |
| --- | --- | --- | --- | --- |
| Words.hk permission/full dataset path | Best domain fit if permission is explicit | Strong Cantonese lexical dataset with definitions, Jyutping, examples, and translations | Current accepted safe path only covers public-domain helper data; full definitions need compatible permission/license | First outreach/research path |
| Cantonese Wiktionary/Kaikki smoke | Open-data path | Aligns with existing Wiktionary-derived source handling | Must prove target-language definitions and enough non-placeholder fixtures | Secondary fallback |
| Commercial/licensed Cantonese dictionary | Production-quality source if contract works | Clearer legal contract can cover app/offline use | Cost, renewal risk, redistribution terms, and attribution must be accepted | Viable if open permission fails |

### Uyghur `ug -> ug`

| Option | Fit | Pros | Constraints | Recommendation |
| --- | --- | --- | --- | --- |
| Curated `ug.wiktionary.org` MediaWiki API | Best current open path | CC BY-SA path can preserve URL/revision/attribution | Current smoke lacks enough balanced non-placeholder noun/adjective/verb entries | Continue curation before adapter |
| Kaikki/Wiktextract dedicated usable data | Scalable open-data path if published/usable | Easier structured extraction if a dedicated source appears | Current dedicated/bulk path is not accepted for production coverage | Recheck periodically |
| Licensed/academic source | Could unblock quality baseline | May provide better native definitions | Terms, app use, redistribution, and data quality must be accepted | Research after Wiktionary curation stalls |

### Vietnamese -> French `vi -> fr`

| Option | Fit | Pros | Constraints | Recommendation |
| --- | --- | --- | --- | --- |
| DBnary/Wiktionary bilingual extraction | Open bilingual data candidate | Sense-linked translations may support dictionary-style entries | Must prove VI->FR coverage and preserve license/attribution | First technical smoke |
| Commercial bilingual dictionary license | Clean production path if affordable | Can provide direct VI->FR dictionary entries | Cost, contract, offline rights, and attribution must be accepted | Best quality fallback |
| User-provided import only | Safe personal-data path | Fits dataset/import feature and avoids shipping app-owned source data | Does not unblock built-in dictionary coverage | Allowed, but not built-in dictionary source |

### Basque `eu -> eu`

| Option | Fit | Pros | Constraints | Recommendation |
| --- | --- | --- | --- | --- |
| Basque Wiktionary/Kaikki | Open-data candidate | Fits existing Wiktionary-derived attribution model | Must prove Basque definitions, morphology fields, and fixture quality | First source smoke |
| Euskaltzaindia/national resource | High authority | Strong linguistic credibility | API/terms/license, rate limits, and redistribution rights must be documented | Best authority path if terms allow |
| Commercial/open Basque lexicon | Production fallback | Contract may clarify usage | Cost and coverage risk | Use if open/national source is unsuitable |

### Ainu, Quechua, Nahuatl, And Guarani

| Option | Fit | Pros | Constraints | Recommendation |
| --- | --- | --- | --- | --- |
| Wiktionary/Kaikki per language | Open-data first pass | Ainu and other low-resource language pages can provide structured starting points | Many entries may be English glosses, dialect-specific, or insufficient for monolingual definitions | Start with the language that has clearest source evidence |
| Academic/public-domain lexicons | Strong source-quality candidate | Can be better curated for endangered/low-resource languages | Terms and app redistribution may be unclear; dialect policy needed | Research before metadata/adapter work |
| Licensed specialist/community dictionaries | Potential production-quality route | Can define rights and attribution | Cost, renewal, and community governance risk | Use only after explicit permission/contract |

Acceptance gate:

- A dedicated source gate doc names an accepted source, license/terms, attribution, representative fixtures/API samples, adapter readiness, and offline/bulk obligations.

Sources:

- Words.hk data pages: https://words.hk/faiman/analysis/
- Kaikki/Wiktextract raw data: https://kaikki.org/dictionary/rawdata.html
- DBnary dataset: https://kaiko.getalp.org/about-dbnary/dataset/
- Wikimedia User-Agent policy: https://foundation.wikimedia.org/wiki/Policy:Wikimedia_Foundation_User-Agent_Policy/en
- Ainu Kaikki page: https://kaikki.org/dictionary/Ainu/index.html

## Support And Feedback Channel

| Option | Fit | Pros | Constraints | Recommendation |
| --- | --- | --- | --- | --- |
| Supabase feedback table plus email notification | Best first MVP | Keeps feedback tied to auth/user ids and existing backend direction; easy to test with RLS/fake email | Needs abuse throttling, support inbox, PII policy, and notification provider | Recommended default |
| Resend transactional email via backend | Simple support email path | Good developer email API; no mobile key exposure if backend-only | Requires verified sender/domain and delivery/error handling | Pair with Supabase table for MVP |
| Zendesk/Help Scout style helpdesk | Mature support workflow | Ticketing, assignment, async conversations, knowledge base integration | More cost/configuration and SDK/API surface | Later upgrade when support volume justifies it |

Acceptance gate:

- Select support destination, storage/retention, user-visible privacy copy, spam controls, and failure states before enabling feedback submission.

Sources:

- Resend API docs: https://resend.com/docs/api-reference/emails/send-email
- Zendesk developer docs: https://developer.zendesk.com/api-reference/

## Auth Token Storage Choice

| Option | Fit | Pros | Constraints | Recommendation |
| --- | --- | --- | --- | --- |
| Expo SecureStore native plus web fallback | Strong mobile security | Uses iOS Keychain/Android Keystore-backed storage through Expo | Requires platform-specific adapter and web fallback behavior | Best native target |
| AsyncStorage everywhere | Simple Supabase React Native path | Fewer platform branches and common examples | Less appropriate for long-lived auth tokens on native | Accept only for fast dev spike |
| Hybrid adapter | Best app fit | SecureStore on native, AsyncStorage/localStorage fallback for web/dev, adapter hides platform details | Slightly more implementation work and tests | Recommended default |

Acceptance gate:

- Decide adapter, package dependencies, migration behavior from old sessions, sign-out clearing behavior, and unconfigured web fallback before real auth code starts.

Sources:

- Supabase React Native Auth quickstart: https://supabase.com/docs/guides/auth/quickstarts/react-native
- Supabase Expo React Native social auth storage notes: https://supabase.com/docs/guides/auth/quickstarts/with-expo-react-native-social-auth
- Expo SecureStore docs: https://docs.expo.dev/versions/latest/sdk/securestore/

## Paid Add-ons For Extra AI Agents

| Option | Fit | Pros | Constraints | Recommendation |
| --- | --- | --- | --- | --- |
| Keep max 3 free only | Best MVP | Avoids billing complexity while dataset-agent storage/quota is still new | No paid expansion path yet | Default until usage is proven |
| RevenueCat entitlements | Strong mobile subscription fit | Handles App Store/Google Play subscription entitlement logic | Needs native billing setup, products, review, and entitlement sync to backend | Prefer if mobile subscriptions are first |
| Stripe Billing/Checkout | Strong web/backend package fit | Flexible web checkout, subscriptions, invoices, customer portal | App-store rules must be respected for mobile digital goods; backend webhook complexity | Prefer if web/backend billing is first |

Acceptance gate:

- Billing provider, entitlement source of truth, refund/cancel behavior, backend quota enforcement, and max-agent override rules are accepted.

Sources:

- RevenueCat React Native docs: https://www.revenuecat.com/docs/getting-started/installation/reactnative
- Stripe Billing docs: https://docs.stripe.com/billing/subscriptions/overview
- Supabase pricing/usage reference: https://supabase.com/pricing

## Next Safe Work

After the product owner chooses a decision:

1. update the matching `.docs/decisions/` record to `Accepted`;
2. update `docs/product-progress.md` with a 3-5 task implementation module;
3. keep unsupported options documented as rejected/deferred;
4. run docs verification before commit.
