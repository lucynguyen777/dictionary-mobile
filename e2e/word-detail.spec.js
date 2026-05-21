import { expect, test } from '@playwright/test';

import { captureUiArtifacts } from './artifacts.js';

test('Word Detail screen renders and captures UI artifacts', async ({ page }, testInfo) => {
  await page.goto('/word?word=articulate&sourceLang=en&targetLang=en');

  await expect(page.getByText('articulate', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('diễn đạt rõ ràng', { exact: true }).first()).toBeVisible();

  for (const tab of ['Meaning', 'Synonyms', 'Collocation & Idiom', 'Conjugation', 'Etymology']) {
    await expect(page.getByText(tab, { exact: true }).first()).toBeVisible();
  }

  await captureUiArtifacts(page, testInfo, 'word-detail');
});
