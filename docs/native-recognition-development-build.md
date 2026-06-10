# Native Recognition Development Build And Separate Chandra Hosting

Status: development-build configuration ready; physical-device MLKit/STT smoke and hosted Chandra smoke still require external runtimes.

## Architecture Boundary

- Camera/image OCR uses MLKit inside an Expo development build.
- Voice lookup uses the OS recognizer through `expo-speech-recognition` inside an Expo development build.
- Scanned PDF OCR uses the standalone Docker service under `backend/chandra-service/`.
- Chandra is not bundled into the mobile app and is not deployed as part of the Vercel static web build.
- Digital PDFs continue through the existing PDF text parser and must never be sent to Chandra.

## Development Build Configuration

The app includes:

- `expo-dev-client` compatible with Expo SDK 54.
- `expo-camera` config plugin with a purpose-specific camera permission.
- `expo-speech-recognition` config plugin with microphone/speech permissions and Android recognizer visibility.
- EAS `development` profile for physical iOS/Android devices.
- EAS `development-simulator` profile for iOS simulator checks. A physical device is still required for reliable camera/STT smoke.

Build and run:

```bash
npm run build:android:development
npm run build:ios:development
npm run start:dev-client
```

For a local native build instead of EAS:

```bash
npx expo run:android
npx expo run:ios
```

Rebuild the development client after changing any native dependency or config plugin.

## Required Device Smoke

1. Install the development build on a physical Android or iOS device.
2. Open the Lookup tab. Confirm no camera or microphone permission is requested on screen entry.
3. Invoke image OCR. Grant camera/photo permission only then; verify MLKit text lines become selectable lookup candidates.
4. Invoke voice lookup. Grant microphone/speech permission only then; verify a final transcript becomes a lookup candidate.
5. Deny each permission once and confirm the app remains usable with a recoverable unavailable state.
6. Repeat in airplane mode. Record whether OCR stays local and whether the device STT implementation works offline.

## Host Chandra Separately

Build the existing service:

```bash
docker build -t dictionaire-chandra backend/chandra-service
docker run --rm -p 8080:8080 \
  -e CHANDRA_MAX_INPUT_BYTES=52428800 \
  -e CHANDRA_TIMEOUT_SECONDS=180 \
  dictionaire-chandra
```

Before using production documents, deploy it to a Docker/GPU-capable host with:

- HTTPS;
- request size and timeout limits;
- authentication or another abuse-control boundary;
- no document-body logging;
- explicit retention/deletion policy;
- Chandra model-license review.

Then set only the public endpoint URL in the app environment:

```text
EXPO_PUBLIC_CHANDRA_OCR_URL=https://your-chandra-host.example
```

Do not put provider credentials or server secrets in any `EXPO_PUBLIC_*` variable.

## Verification Ownership

- Codex/repository: dependency/config/build-profile guards, unit tests, fallback behavior, and Chandra request contract.
- User/device: EAS credentials, install development builds, grant/deny native permissions, physical-device MLKit/STT smoke.
- User/infrastructure: select and operate the separate Chandra host, then provide its HTTPS endpoint.

## Security Notes

- The current npm audit includes development-tooling advisories, including Vitest UI-server advisories and Expo dependency-chain advisories. Do not expose Vitest UI or Metro/dev servers publicly.
- Do not use `npm audit fix --force`; required major upgrades must be handled as a dedicated Expo SDK/Vitest migration.
- Chandra documents may contain sensitive material. Keep the endpoint disabled until hosting privacy, authentication, limits, and retention are accepted.
