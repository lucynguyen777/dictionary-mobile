# Kế hoạch hoàn thiện sản phẩm Dictionary Mobile

Cập nhật: 2026-10-11 · Baseline: v1.3.8 (`main` @ `215e576`)

Tài liệu này tổng hợp audit code (UI, data, backend, migrations) đối chiếu với `docs/product-progress.md`, `.ai/context/*` và `DESIGN.md`, rồi đề xuất lộ trình để đưa sản phẩm tới trạng thái hoàn thiện đầy đủ tính năng. `docs/product-progress.md` vẫn là checklist chính thức; khi bắt đầu một phase, kéo các task tương ứng vào `Next Work Module` theo đúng quy tắc tối đa 5 task.

## 1. Bối cảnh và hướng sản phẩm

- App từ điển + học từ vựng **local-first** (Expo Router, iOS/Android/Web), ưu tiên: tra cứu sâu → tủ từ/folder → flashcard SRS → Reader → import/export → quyền riêng tư → mở rộng ngôn ngữ từ nguồn hợp pháp.
- Triết lý: hỗ trợ sâu từng ngôn ngữ thay vì nông nhiều ngôn ngữ; **không dùng máy dịch làm dữ liệu từ điển**; mọi tính năng cốt lõi phải chạy khi backend không cấu hình.
- Backend tuỳ chọn: Supabase (Auth + Cloud Sync), Vercel function `/backend-proxy` (DeepL, OpenAI, Google Sheets, feedback), dịch vụ OCR Chandra (FastAPI).
- Quyết định đã chấp nhận (`.ai/context/blocked-decisions.md`): Azure Pronunciation Assessment, Supabase feedback + Resend, SecureStore token, tối đa 3 AI agent/user, không billing trong MVP.

## 2. Kết quả audit

### 2.1 Sức khoẻ kỹ thuật

| Kiểm tra | Kết quả |
| --- | --- |
| `npx tsc --noEmit` | Pass |
| `npm run lint` | Pass |
| `npx vitest --run` | 95 file, 469/469 test pass |
| CI (`.github/workflows/verify.yml`) | Static + unit + Playwright web E2E |

### 2.2 Chênh lệch giữa tài liệu và code (quan trọng nhất)

Tài liệu ghi một số mảng là "Fully implemented" nhưng code thực tế chưa chạy được:

| Mảng | Tài liệu nói | Code thực tế |
| --- | --- | --- |
| Cloud Sync push | Đồng bộ đầy đủ profile/folder/word/flashcard… | `data/supabaseSyncRuntimeAdapter.ts:153` upsert `row.remoteRow ?? { id }`, nhưng không chỗ nào gán `remoteRow` → chỉ gửi `{id, user_id}`, vi phạm NOT NULL; `user_profiles`/`saved_word_folders` không có cột `id`. `supabaseSyncMappers.ts` chỉ được test dùng. |
| Cloud Sync pull | Áp dụng thay đổi từ xa | `data/supabaseSyncLocalPort.ts:111` bỏ qua mọi row không phải tombstone → chỉ áp dụng xoá. Cursor `gt(updated_at)` không tie-break, không phân trang. |
| Backend proxy trên native | DeepL/AI Tutor hoạt động | `data/backendProxyClient.ts:67-73` trả base URL rỗng trên native → request tương đối không resolve được. Chỉ chạy trên web. |
| OCR ảnh (camera) | Contracts sẵn sàng | `app/(tabs)/word.tsx` gọi `performOCR` không truyền engine → trả **fixture text**; nút Voice/OCR chỉ hiện alert; modal nhận dạng không thể mở được. |
| Thống kê Home | — | `data/dictionary.ts:225` hardcode streak 12 / mastered 128 / due 18. |
| AI chat | AI Tutor hoạt động | `ai-assistant.tsx` chạy thật, nhưng panel AI trong `advanced.tsx:796-947` bị đánh dấu "future" và vô hiệu hoá. |
| Dịch trong tab Word | Theo cặp ngôn ngữ | `components/word/TabPager.tsx:328` luôn `targetLang="VI"`. |
| Offline pack | MVP runtime ready | Chỉ 1 pack dev 2 entry, URL tương đối không tải được trên native. |

### 2.3 Rủi ro bảo mật

| # | Vấn đề | Vị trí | Mức |
| --- | --- | --- | --- |
| S1 | RLS `for all` cho client trên bảng chỉ-server: `proxy_usage_events`, `translation_agent_usage_events`, `daily_token_usage`, `user_provider_secret_envelopes` → client sửa/xoá quota và secret | `supabase/migrations/002:171-180` + `007` | Cao |
| S2 | Insert trực tiếp vào `feedback` vượt rate limit backend | `008:23-26` | Trung bình |
| S3 | Dịch vụ Chandra không xác thực, chạy root, `filePath` đọc file tuỳ ý, decode base64 trước khi kiểm size | `backend/chandra-service/app/main.py:94-106` | Cao (khi deploy) |
| S4 | Google OAuth: state chỉ ký userId người tạo → login-CSRF/trộn tài khoản; `normalizeReturnTo` chấp nhận `//evil.com` (open redirect) | `backend/googleSheetsOAuth.ts:163`, `server.ts:68` | Cao |
| S5 | AI proxy nhận role `system` từ client → ghi đè prompt tutor, dùng như OpenAI proxy chung | `backend/proxyRequestValidation.ts:376` | Trung bình |
| S6 | Lộ body lỗi upstream/`error.message` cho client; CORS mở | `backend/server.ts:37,70,315,370` | Thấp |
| S7 | DeepL `auth_key` trong body (đã deprecated, nên dùng header) | `backend/server.ts:298` | Trung bình (có thể đã hỏng) |
| S8 | Session Supabase > 2048 byte trong SecureStore; web dùng localStorage | `data/authTokenStorage*.ts` | Trung bình |
| S9 | Quota in-memory, reset mỗi cold start serverless; kiểm tra `daily >= limit` thay vì `next > limit` | `backend/quotaTracker.ts:92,105` | Trung bình |
| S10 | Revoke Google không gọi revoke endpoint | `backend/googleSheetsStore.ts:63` | Thấp |

### 2.4 Rủi ro dữ liệu và kiến trúc

- **Mất dữ liệu tiềm ẩn**: tăng `USER_DATABASE_SCHEMA_VERSION` sẽ chạy lại migration từ AsyncStorage (đã bị dọn) rồi `replaceUserDatabaseRows` xoá sạch SQLite (`data/userDatabaseRuntime.ts:198-215`). Không có đường nâng cấp schema bằng `ALTER`.
- Mỗi lần lưu xoá và ghi lại toàn bộ DB (`userDatabaseMigration.ts:233+`), mở/đóng DB nhiều lần.
- FK `(user_id, connection_id) on delete set null` sẽ lỗi vì `user_id` NOT NULL (`002:137`); policy migration không idempotent; thiếu số migration 003–005.
- Không có timeout/AbortController cho fetch (dictionary API, DeepL, OpenAI, Google).
- `dictionaryApi.ts` (2.4k dòng, ~40 fetcher gần trùng lặp, chuỗi ~33 `if`), `localLexicon.ts` (3k), `morphology.ts` (2.3k): khó mở rộng ngôn ngữ.

### 2.5 UI/UX

- 5 màn hình khổng lồ: `profile.tsx` 3505, `advanced.tsx` 3096, `library.tsx` 2342, `reader.tsx` 1974, `word.tsx` 1847 dòng (+ `TabPager.tsx` 1386).
- Vi phạm `DESIGN.md`: hàng trăm mã màu hex (`advanced` 243, `library` 180, `profile` 274 với palette riêng); `folder/[id].tsx` và `auth/callback.tsx` không theme → hỏng dark mode.
- Primitive của design system (`AppButton`, `Surface`, `SectionTitle`) **không được dùng ở đâu**; template create-expo-app còn sót (`explore`, `modal`, `hello-wave`, `parallax-scroll-view`…).
- Trùng lặp: language picker (Home không chặn ngôn ngữ unavailable), `FutureFeatureNotice`, export handler, danh sách màu folder.
- Thiếu `.catch`/loading cho load ban đầu (callback auth có thể kẹt loading; folder hiện "Không tìm thấy" trước khi load).
- Accessibility: gần như không có `accessibilityRole/Label` ở word/library/advanced/reader; scrubber Reader không truy cập được; target < 40px.
- Hiệu năng Reader: mỗi từ một `TouchableOpacity`, không ảo hoá → tài liệu dài chậm. `Dimensions` tĩnh vs `useWindowDimensions` lệch khi xoay. `Screen.tsx` dùng `SafeAreaView` của RN core (không inset Android).

### 2.6 Quan sát về quy trình

30/50 commit gần nhất là "language source readiness" cho từng ngôn ngữ preview, trong khi các luồng cốt lõi đang được ghi DONE (sync, AI native) chưa chạy thật. Đề xuất cân bằng lại: **sửa độ đúng và bảo mật trước, mở rộng ngôn ngữ sau**, và thêm test tích hợp thật (không chỉ fake hoặc so khớp chuỗi) cho các luồng được ghi "production-ready".

## 3. Định nghĩa "hoàn thiện đầy đủ tính năng" (v2.0)

1. Mọi tính năng hiển thị trong UI hoặc chạy thật, hoặc bị ẩn hay đánh dấu rõ ràng là chưa có. Không còn số liệu giả hay fixture text.
2. Auth + Cloud Sync hai chiều hoạt động thật giữa 2 thiết bị, có xử lý xung đột và tombstone; xoá tài khoản thật.
3. DeepL/AI Tutor/Google Sheets/Feedback chạy trên **cả web và native**, với quota bền vững và bảo mật RLS đúng.
4. OCR camera (MLKit) và STT (expo-speech-recognition) chạy trên dev-client/production build; scanned-PDF OCR qua Chandra có xác thực.
5. Ít nhất 1 ngôn ngữ ngoài EN/VI được promote production kèm offline pack tải được trên native.
6. UI tuân thủ `DESIGN.md` (token, dark mode, a11y cơ bản), không còn template code.
7. Phát hành iOS/Android qua EAS lên store, có crash reporting và OTA update.

## 4. Lộ trình

Mỗi phase là một hoặc vài module trong `docs/product-progress.md`. Các task cần setup bên ngoài được ghi rõ ở cột "Cần chủ sản phẩm".

### Phase 0: Ổn định và bảo mật (v1.4.0) · ưu tiên cao nhất, không cần credential mới

| Task | Phạm vi | Độ khó |
| --- | --- | --- |
| 0.1 | Migration `009_server_only_tables.sql`: bỏ quyền ghi của `authenticated` trên bảng usage/quota/secret-envelope (chỉ `select` own hoặc không có quyền); bỏ insert trực tiếp vào `feedback` (chỉ qua backend service role); sửa FK `on delete set null`; policy idempotent. Thêm test RLS chạy thật trên Supabase local (`supabase start`) thay vì so khớp chuỗi. | HARD |
| 0.2 | Google OAuth: ràng buộc state với nonce lưu server/cookie và kiểm tra user hiện tại ở callback; chặn `//` và `/\` trong `returnTo`; gọi revoke endpoint của Google. | MEDIUM |
| 0.3 | AI proxy: loại bỏ role `system` từ client, prompt hệ thống chỉ ở server; ẩn body lỗi upstream; giới hạn CORS theo origin; tăng body limit cho khớp giới hạn message; DeepL dùng header `Authorization: DeepL-Auth-Key`. | MEDIUM |
| 0.4 | Quota bền vững: lưu vào Supabase (bảng chỉ-server) hoặc Vercel KV, kiểm tra `next > limit`, atomic (RPC/`upsert ... returning`). | MEDIUM |
| 0.5 | Chandra: API key/JWT Supabase, bỏ `filePath`, kiểm size trước khi decode, chạy non-root, gọi qua `/backend-proxy` thay vì trực tiếp từ client. | MEDIUM |
| 0.6 | SQLite: thay "re-migrate khi đổi version" bằng migration tuần tự `ALTER TABLE`; ghi incremental thay vì xoá ghi toàn bộ; test nâng cấp v2→v3 không mất dữ liệu. | HARD |
| 0.7 | Fetch timeout + AbortController chung (`data/http.ts`) cho dictionary API và backend provider. | EASY |
| 0.8 | `LargeSecureStore` (AES key trong SecureStore, session mã hoá trong AsyncStorage) cho session Supabase trên native. | MEDIUM |

### Phase 1: Sự thật sản phẩm (v1.4.1) · sửa mọi chỗ UI nói sai

| Task | Phạm vi | Độ khó |
| --- | --- | --- |
| 1.1 | Thống kê Home lấy từ `libraryStore`/`activityStore` (streak, mastered, due, score); word-of-the-day tính theo ngày hiện tại. | EASY |
| 1.2 | Gộp AI chat: panel trong `advanced.tsx` điều hướng tới `ai-assistant` (hoặc nhúng chung component), bỏ `isFutureFeature` hardcode. | EASY |
| 1.3 | `TranslationPanel` dùng target theo cặp ngôn ngữ đã chọn / ngôn ngữ mẹ đẻ trong profile. | EASY |
| 1.4 | `backendProxyClient`: base URL tuyệt đối từ `EXPO_PUBLIC_BACKEND_PROXY_URL` cho native; dùng singleton Supabase client. Test cho native URL. | EASY |
| 1.5 | OCR ảnh: không bao giờ trả fixture ngoài test; khi chưa có engine hiển thị trạng thái "chưa khả dụng"; xoá modal nhận dạng không thể mở hoặc nối đúng luồng. | EASY |
| 1.6 | Cập nhật `docs/product-progress.md`, `.ai/context/current-product-state.md`, `blocked-decisions.md`: Cloud Sync ghi đúng là "push/pull chưa hoàn chỉnh". Thêm doc-guard test. | EASY |

### Phase 2: Cloud Sync thật (v1.5.0)

| Task | Phạm vi | Độ khó |
| --- | --- | --- |
| 2.1 | `loadDirtyRows` đọc row SQLite đầy đủ và map bằng `supabaseSyncMappers` → `remoteRow`; sửa conflict target cho bảng không có `id`. | HARD |
| 2.2 | `applyRemoteChanges` upsert insert/update theo last-writer-wins dựa trên `updated_at` + `remote_version`, giữ tombstone. | HARD |
| 2.3 | Pull cursor dạng `(updated_at, id)` + phân trang; test nhiều row cùng timestamp. | MEDIUM |
| 2.4 | Test tích hợp với Supabase local: 2 client giả lập 2 thiết bị; xung đột; xoá; đăng xuất giữ dữ liệu local. | HARD |
| 2.5 | Lifecycle: sync tự động khi foreground/sau thay đổi (debounce), vẫn có opt-in; chỉ báo trạng thái qua `SyncStatusIndicator`. | MEDIUM |
| 2.6 | Xoá tài khoản: route backend dùng service role, xoá dữ liệu remote → sign out → tuỳ chọn giữ/xoá local; test không mất dữ liệu local ngoài ý muốn. | HARD |

**Cần chủ sản phẩm:** redirect allow-list Supabase, 2 tài khoản test, `SUPABASE_SERVICE_ROLE_KEY` trên Vercel (server-only).

### Phase 3: Design system và chất lượng UI (v1.6.0) · có thể chạy song song Phase 2

| Task | Phạm vi | Độ khó |
| --- | --- | --- |
| 3.1 | Xoá template (`explore`, `modal`, `hello-wave`, `parallax-scroll-view`, `external-link`, `ui/collapsible`, `themed-*` nếu không dùng). | EASY |
| 3.2 | Theme hoá `folder/[id].tsx`, `auth/callback.tsx`; chuyển palette riêng của `profile.tsx` về token; thêm lint rule chặn hex literal trong `app/` và `components/` (trừ `constants/theme.ts`). | MEDIUM |
| 3.3 | Tách màn hình lớn thành `components/<feature>/…`: Profile (settings drawer, stats, account, offline packs, privacy), Advanced (flashcards, import, export, reader library), Library (toolbar, grid, sheets, import mapping), Reader (renderer, dock, sheets), Word (search, language select). Mục tiêu: mỗi file < 600 dòng. | HARD |
| 3.4 | Dùng chung `LanguageSelect`, `FutureFeatureNotice`, export helper, folder colors; Home chặn ngôn ngữ unavailable. | MEDIUM |
| 3.5 | Áp dụng `AppButton`/`Surface`/`MotionPressable` thay `TouchableOpacity` rải rác. | MEDIUM |
| 3.6 | Loading/error state cho mọi load ban đầu (skeleton + retry); sửa `Screen.tsx` dùng `react-native-safe-area-context`; `useWindowDimensions` thống nhất. | MEDIUM |
| 3.7 | Accessibility: role/label/hitSlop cho icon button, `tab` role cho `StickyTabBar`, scrubber dùng `accessibilityActions` adjustable; nhãn tiếng Việt nhất quán. | MEDIUM |
| 3.8 | Reader hiệu năng: render theo đoạn bằng `FlatList`, chỉ tách token khi chạm vào đoạn; test tài liệu 1MB. | HARD |
| 3.9 | Bổ sung Playwright E2E cho Library, Flashcards, Reader, Profile (hiện chỉ có Word/Recognition/Offline pack) và kiểm light/dark. | MEDIUM |

### Phase 4: Tính năng phụ thuộc provider (v1.7.x)

| Task | Phạm vi | Cần chủ sản phẩm |
| --- | --- | --- |
| 4.1 | DeepL + AI Tutor production smoke trên web và native; AI streaming (SSE). | Key DeepL/OpenAI, spend limit |
| 4.2 | Google Sheets export bật trong UI (sau Phase 0.2), smoke production. | `SUPABASE_SERVICE_ROLE_KEY`, `USER_PROVIDER_SECRET_ENCRYPTION_KEY` |
| 4.3 | Feedback form trong Profile (thay nút disabled) + Resend notification + Help center/legal pages thật (Privacy Policy, Terms bắt buộc cho store). | Domain Resend, inbox support, nội dung pháp lý |
| 4.4 | Đổi mật khẩu, khôi phục mật khẩu trong Profile. | — |
| 4.5 | Glossary/dataset chuyên ngành: dùng các bảng đã có ở migration 002, giới hạn 3 agent, upload CSV/TSV/DOCX/PDF text. | — |
| 4.6 | Azure Pronunciation Assessment: fake-provider route và test trước, rồi upload audio, quota, retention, UI điểm phoneme. | Azure Speech resource |

### Phase 5: Native recognition (v1.8.0)

- 5.1 Dev-client build (EAS `development`) và smoke trên thiết bị thật theo `docs/native-recognition-development-build.md` / `docs/dev-client-smoke-matrix.md`.
- 5.2 Nối `MLKitOCRProvider` vào luồng camera của Word (chọn vùng chữ → tra cứu); fallback rõ ràng trên Expo Go/web.
- 5.3 `expo-speech-recognition` cho voice search, có xin quyền và trạng thái offline.
- 5.4 Native PDF import (pdf.js trong WebView hoặc native module) thay alert "không hỗ trợ".
- 5.5 Deploy Chandra (Cloud Run/Fly) sau hardening Phase 0.5.

**Cần chủ sản phẩm:** tài khoản EAS/Apple/Google, thiết bị test.

### Phase 6: Nội dung và ngôn ngữ (liên tục, v1.9+)

- 6.1 Refactor `dictionaryApi.ts` thành registry adapter khai báo (mỗi ngôn ngữ một module nhỏ: source, normalize, morphology, attribution); xoá chuỗi `if` và danh sách ngôn ngữ lệch nhau (`canUseMonolingualDictionaryApi`).
- 6.2 Pipeline Wiktextract/Kaikki dùng chung: tải dump có revision → lọc section ngôn ngữ → SQLite pack + checksum + attribution (`scripts/build-offline-pack.mjs` mở rộng).
- 6.3 Hosting pack trên CDN với URL tuyệt đối; tải được trên native; UI attribution (CC BY-SA).
- 6.4 Promote French theo gate trong `data/languageProductionRoadmap.ts` (≥5.000 entry, exact ≥95%, ví dụ ≥40%, quan hệ ≥30%); sau đó Malay, Spanish.
- 6.5 Mở rộng EN/VI offline pack (Batch 0) để tra cứu không mạng thật sự.
- 6.6 Ngôn ngữ bị chặn bởi nguồn (yue, ug, vi→fr, …): chỉ làm khi source gate pass.

### Phase 7: Phát hành v2.0

- 7.1 Crash/error reporting (Sentry hoặc EAS Observe), analytics opt-in tôn trọng privacy.
- 7.2 EAS Update (OTA) và kênh `preview`/`production`.
- 7.3 Store listing, screenshot, Privacy Nutrition Label / Data Safety, account deletion URL (yêu cầu của Apple/Google).
- 7.4 i18n chuỗi UI (hiện tiếng Việt hardcode) nếu nhắm thị trường ngoài VN.
- 7.5 Release checklist theo `docs/testing-and-build-guide.md` và smoke production.

## 5. Thứ tự đề xuất và ước lượng

| Thứ tự | Phase | Ước lượng | Phụ thuộc |
| --- | --- | --- | --- |
| 1 | Phase 0: Ổn định và bảo mật | 1,5–2 tuần | Không |
| 2 | Phase 1: Sự thật sản phẩm | 3–5 ngày | Không |
| 3 | Phase 2: Cloud Sync thật | 2–3 tuần | Phase 0.1, 0.6; setup Supabase |
| 3′ | Phase 3: Design system/UI | 2–3 tuần (song song) | Không |
| 4 | Phase 4: Provider | 2–4 tuần | Credential của chủ sản phẩm |
| 5 | Phase 5: Native recognition | 2 tuần | EAS, thiết bị |
| 6 | Phase 6: Ngôn ngữ/offline | Liên tục | Phase 6.1 trước |
| 7 | Phase 7: Phát hành v2.0 | 1–2 tuần | Phase 0–5 |

## 6. Việc cần chủ sản phẩm chuẩn bị sớm

1. Supabase: redirect allow-list, 2 user test, service-role key (chỉ trong Vercel server env).
2. Vercel server env: `DEEPL_API_KEY`, `OPENAI_API_KEY`, `OPENAI_TEXT_MODEL`, `USER_PROVIDER_SECRET_ENCRYPTION_KEY`, `GOOGLE_OAUTH_CLIENT_SECRET`.
3. Resend domain + inbox support; Privacy Policy/Terms.
4. Tài khoản EAS, Apple Developer, Google Play Console.
5. Azure Speech resource (khi bắt đầu Phase 4.6).
6. Hosting cho Chandra OCR và CDN cho offline pack.

## 7. Progress status (updated 2026-10-11)

Branches stack in order: `claude/v1.4.1-product-truth` → `claude/v1.5.0-cloud-sync` → `claude/v1.6.0-design-system` → `claude/v1.7.0-account-features` (PR #3 merged v1.4.0). Details per task live in `docs/product-progress.md`.

| Phase | Done | Open (and why) |
| --- | --- | --- |
| 0 Stability/security | 0.1, 0.2, 0.3, 0.4 durable quota (migration 011), 0.5 Chandra hardening, 0.6, 0.7 fetch timeouts (`data/http.ts`), 0.8 session in chunked SecureStore entries (`data/chunkedSecureStorage.ts`) | Migrations 009–011 not applied (D2) |
| 1 Product truth | 1.1–1.6 | — |
| 2 Cloud Sync | 2.0–2.5 (two-device test on Postgres + RLS) | 2.6 account deletion (D3); production smoke (D2) |
| 3 Design system/UI | 3.1–3.9 (3.5 shared Touchable primitive + lint guard; 3.3 every screen under 600 lines; 3.2 hex-literal lint guard; 3.7 icon-button label guard; 3.8 virtualized Reader, 1 MB document test) | Library/Training/Profile stylesheet palette → tokens (D7) |
| 4 Providers | 4.1 AI streaming, 4.3 feedback form, 4.4 password change/reset, 4.5 specialized translation (glossary and sentence memory per domain, CSV/TSV/DOCX/PDF import, up to 3 agent presets, account sync), Sheets export fake-API tests | 4.1/4.2 production smoke (keys); 4.3 legal/help + Resend (D5); 4.5 free-text agent instructions (D10), DeepL glossaries (D15); 4.6 Azure scoring (D6) |
| 5 Native recognition | 5.2 camera OCR, 5.3 voice search and 5.4 native PDF (WebView pdf.js) integrated with fallbacks and tests, enabled in dev-client builds only | 5.1 device smoke (EAS account + devices) before enabling in production; 5.5 Chandra stack ready to deploy, host choice (D9) |
| 6 Languages/offline | 6.1 declarative local-pack registry, 6.2 pack pipeline + import validation (`--lemmas-only`, `--rank-by richness`), 6.3 catalog tooling + app catalog loading, French/Spanish pack and web UI smoke, full-size pack sizing (`docs/offline-pack-sizing.md`), 6.5 Vietnamese pack source passes | 6.3/6.5 need CDN hosting; 6.4 French, Spanish, Russian, Korean and Turkish source gates and pack smoke pass, pack scope/host (D9); Japanese examples need D12; Chinese exact-lookup gap is missing content in the Chinese Wiktionary itself (D16); Malay needs D11; 6.6 VI→FR source probed and passing (`docs/vi-fr-source-gate.md`), approval D13; Basque probed and failing on open data (`docs/basque-source-gate.md`, D14); Uyghur, Cantonese, Nahuatl, Quechua, Ainu, Guarani have no open source above 5,000 entries (`docs/language-source-gates.md`) |
| 7 Release v2.0 | 7.5 release checklist (`docs/release-checklist-v2.md`); 7.2 expo-updates, runtime version and channels configured; 7.1 error boundary + provider-neutral redacting reporter; 7.3 privacy-label draft from a network inventory (`docs/store-privacy-answers-draft.md`) | 7.1 choose and plug in the provider (D8); 7.2 project link and 7.3 store listing need the Expo/store accounts, D3, D5 |

## 8. Pending owner decisions

Work that needs one of these decisions is paused; other work continues. Updated as modules land.

| # | Decision | Why it matters | Default if no answer |
| --- | --- | --- | --- |
| D1 | Create PRs for the stacked branches `claude/v1.4.1-product-truth`, `claude/v1.5.0-cloud-sync`, `claude/v1.6.0-design-system` and `claude/v1.7.0-account-features`? | Code is pushed but not under review. | Keep stacking branches; open PRs when asked. |
| D2 | Restore the paused Supabase project and apply migrations 009, 010 and 011? | Security hardening, sync cursor and durable proxy quota (011) only take effect once applied; production smoke needs it. Until 011 is applied the proxy falls back to per-instance in-memory quota. | Not applied. |
| D3 | Account deletion: delete immediately, or soft-delete with a recovery window (e.g. 30 days)? After deletion, keep or wipe the data on the device? | Determines backend design (immediate admin delete vs scheduled purge) and UI copy. Store review requires in-app deletion. | Paused (plan 2.6). Suggested: immediate server deletion, keep local data with an explicit "also erase this device" option. |
| D4 | Set `BACKEND_PROXY_ALLOWED_ORIGINS` on Vercel if the web app runs on domains other than production. | Other web origins are blocked by CORS. | Production + localhost only. |
| D5 | Legal and support content: who writes the Privacy Policy, Terms and help-center text, where they are hosted, and which support inbox/Resend domain receives feedback notifications? | Store submission requires a Privacy Policy and Terms; the Help center row still shows a placeholder; feedback is stored but nobody is notified. | Paused (plan 4.3 legal/help part). Feedback is saved to the `feedback` table only. |
| D6 | Pronunciation scoring (Azure): how long may raw audio be kept (suggested: not stored; streamed to Azure and discarded), and is a per-user daily scoring cap acceptable? | `.ai/context/blocked-decisions.md` gates scoring code on a retention policy and account-deletion behavior. | Paused (plan 4.6). |
| D7 | Library/Training/Profile still use their own warm-grey/blue palette in light mode. Move them to theme tokens (visible restyle toward the purple accent) or keep the current look? | Converting changes how three tabs look; dark mode already works through themed overlays. | Keep current look; conversion paused. |
| D8 | Crash/error reporting for v2.0: Sentry or EAS Observe, and opt-in or on by default? | Affects privacy copy, store data-safety labels, and SDK setup. | Paused (plan 7.1). |
| D9 | Offline packs: where to host them (CDN/bucket) and how big the first packs should be? French Wiktionary has ~496k lemmas; options: full lemma pack (large download), or top-N by a frequency list (needs a licensed list). | French passes every source gate; only the pack smoke and UI smoke remain. English needs the same choice to replace the 2-entry sample pack. | Paused (plan 6.3/6.4/6.5). Suggested: a lemma-only pack capped at ~50k headwords per language on a static bucket. Measured in `docs/offline-pack-sizing.md`: lemma-only, 50k by richness = 21–30 MB download, 120–140 MB on device, 99–100% of common-word probes (Korean full: 3.7 MB). |
| D10 | Specialized translation "context agents" (up to 3 per user, plan 4.5): may users write their own instructions for the AI? | Phase 0.3 made the proxy reject client-written system prompts. Agents with free-text instructions undo that for the user's own requests (prompt-injection and abuse surface, higher token cost). Alternative: agents as presets of fixed options (domain, tone, formality, which glossaries), with no free text. | Presets without free text are built (pair, domain, tone; up to 3, synced). Free-text instructions stay off unless approved. |
| D11 | Malay: no open corpus with Malay definitions is large enough (mswiktionary: 73% of common words). Show English definitions from English Wiktionary for Malay (90–93% coverage, examples 50%), license a Malay dictionary (Dewan Bahasa dan Pustaka), or keep Malay in preview? | Malay cannot pass the monolingual gates with open data; see `docs/malay-100-headword-measurement.md`. | Malay stays preview on the hosted source. |
| D12 | Japanese examples: the Japanese Wiktionary has example sentences for only 36.7% of common words (gate 40%). English Wiktionary has Japanese example sentences for 86%, shown there with English translations. May Japanese entries show those Japanese sentences (credited, translation hidden or shown as an English aid)? | Last gate Japanese misses; related words already pass with helper relations. | Japanese stays preview. |
| D13 | VI→FR dictionary source: approve the French Wiktionary's Vietnamese section (16k headwords, French glosses and translated examples, CC BY-SA) with English-Wiktionary Vietnamese relations as a credited helper? | It passes every source gate (`docs/vi-fr-source-gate.md`); `.ai/context/blocked-decisions.md` keeps VI→FR blocked until a source is approved. | Paused; VI→FR stays source-gated. |
| D14 | Basque: no open source passes (Basque Wiktionary lacks 43% of common words; English Wiktionary has English definitions and few examples). Ask Euskaltzaindia/Elhuyar about licensing their dictionary, or keep Basque out of scope? | `docs/basque-source-gate.md`; Basque stays source-gated either way until a source passes. | Basque stays source-gated. |
| D15 | DeepL glossaries: specialized translation uses OpenAI with the user's glossary in the prompt. Should Word/Reader DeepL translations also apply the user's glossary? That needs the proxy to create and cache DeepL glossaries in the owner's DeepL account (one per user glossary and pair, with an account-wide glossary limit and cleanup). | Remaining 4.5 note "DeepL glossary support"; DeepL supports Vietnamese glossaries. | Paused; glossaries apply to specialized translation only. |
| D16 | Chinese definitions: the Chinese Wiktionary has no definitions for about 30% of common words (e.g. `做`, `来`, `时间`), so it cannot pass the 95% gate. Options: ask Taiwan's Ministry of Education about app use of 《重編國語辭典修訂本》 (its licence for redistribution is not stated clearly), license a commercial Chinese dictionary, or keep Chinese in preview. | `docs/native-wiktionary-source-measurements.md`; no pipeline change can close the gap. | Chinese stays preview. |
