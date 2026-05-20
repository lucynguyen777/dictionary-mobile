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

See [Testing And Build Guide](docs/testing-and-build-guide.md) for the full QA matrix, unit test guidance, manual smoke checklist, and release checklist.

## Project Docs

- [Product Progress](docs/product-progress.md): canonical roadmap, queue, and completion checklist.
- [Testing And Build Guide](docs/testing-and-build-guide.md): QA workflow, unit tests, build/run commands, and release checklist.
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
