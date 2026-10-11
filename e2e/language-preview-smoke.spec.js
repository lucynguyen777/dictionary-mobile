import { expect, test } from '@playwright/test';

// Word screen smoke for the languages whose sources passed promotion measurement (French, Spanish).
// The Wiktionary API is replayed from recorded responses (CC BY-SA 4.0/GFDL) so the run is deterministic.
const cases = [
  { gloss: 'Qui est fabriqué à la maison.', ipa: '/mɛ.zɔ̃/', lang: 'fr', word: 'maison' },
  { gloss: 'Edificación destinada a vivienda.', ipa: null, lang: 'es', word: 'casa' },
];

for (const { gloss, ipa, lang, word } of cases) {
  test(`${lang}: Word shows Wiktionary meanings for "${word}"`, async ({ page }) => {
    await page.route('https://api.wiktapi.dev/**', (route) =>
      route.request().url().includes(`/${lang}/word/${encodeURIComponent(word)}`)
        ? route.fulfill({ contentType: 'application/json', path: `e2e/fixtures/wiktapi-${lang}-${word}.json` })
        : route.fulfill({ body: '{"error":true}', contentType: 'application/json', status: 404 })
    );

    await page.goto(`/word?word=${encodeURIComponent(word)}&sourceLang=${lang}&targetLang=${lang}`);
    await expect(page.getByText(word, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(gloss, { exact: false }).first()).toBeVisible();
    if (ipa) await expect(page.getByText(ipa, { exact: true }).first()).toBeVisible();
    // The source gives no part of speech here; no placeholder heading may stand in for it.
    await expect(page.getByText('word', { exact: true })).toHaveCount(0);
    await page.screenshot({ path: test.info().outputPath(`${lang}-${word}.png`), fullPage: false });

    await page.getByLabel('Thêm vào yêu thích').click();
    await expect(page.getByLabel('Bỏ khỏi yêu thích')).toBeVisible();
    await page.goto('/library');
    await expect(page.getByText(word, { exact: true }).first()).toBeVisible();
  });
}
