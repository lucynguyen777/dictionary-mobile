# Dictionary Mobile

Dictionary Mobile is a local-first Expo Router app for dictionary lookup, saved vocabulary, flashcards, imports/exports, Reader workflows, and multilingual adapter expansion.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the Expo dev server

   ```bash
   npm start
   ```

3. Run a platform target when needed

   ```bash
   npm run web
   npm run android
   npm run ios
   ```

## Verification

Run these before marking code work done:

```bash
npx tsc --noEmit
npm run lint
```

Run the full unit suite when changing data logic, parser behavior, adapters, stores, or covered behavior:

```bash
npm test -- --run
```

Focused examples:

```bash
npm test -- --run tests/dictionaryApi.test.ts
npm test -- --run tests/readerImport.test.ts
```

Run Expo Web UI artifact tests when a user-facing browser flow needs screenshot, trace, video, DOM, or visible-text evidence:

```bash
npm run test:e2e
npm run test:e2e:branch
```

Run native Maestro smoke only after installing the app on a simulator/device. For Expo Go, start Expo, set the target deep link, then choose the platform script:

```bash
export EXPO_GO_WORD_URL=<expo-go-url-for-/word?word=articulate&sourceLang=en&targetLang=en>
npm run test:native:maestro:expo-go:ios
npm run test:native:maestro:expo-go:android
```

See [Testing And Build Guide](docs/testing-and-build-guide.md) for the full QA matrix, unit test guidance, manual smoke checklist, and release checklist.

## Deployment

The current deployable release is local-first. The selected first deployment path is Vercel static web hosting. Web can be exported as static files with:

```bash
npm run build:web:clean
```

Use `dist` as the static hosting output directory. `vercel.json` contains the matching build/output settings and route rewrites. Native preview/production builds are configured through EAS scripts in `package.json`.

See [Deployment Options](docs/deployment-options.md) for web hosting choices, EAS build commands, current app identifiers, store checklist, and rollback notes.

## Project Docs

- [Product Progress](docs/product-progress.md): canonical roadmap, queue, and completion checklist.
- [Testing And Build Guide](docs/testing-and-build-guide.md): QA workflow, unit tests, build/run commands, and release checklist.
- [Deployment Options](docs/deployment-options.md): web/static hosting, native EAS builds, store readiness, and release path.
- [Cache And Fixtures](docs/cache-and-fixtures.md): runtime cache and deterministic fixture policy.

## Notes

- User data is local-first unless an accepted backend/cloud decision exists.
- Dictionary work must build monolingual lookup first and must not use machine translation as dictionary data.
- Auth, cloud sync, OAuth, AI, speech scoring, production translation, and licensed offline bundles remain blocked until accepted decisions exist.

## Expo References

This project uses [Expo](https://expo.dev) and [Expo Router](https://docs.expo.dev/router/introduction/).

- [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go)
