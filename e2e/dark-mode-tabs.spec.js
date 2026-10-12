import { expect, test } from '@playwright/test';

import { captureUiArtifacts } from './artifacts.js';

test.use({ colorScheme: 'dark' });

for (const [name, path, text] of [
  ['home', '/', 'Dictionaire'],
  ['word', '/word?word=articulate&sourceLang=en&targetLang=en', 'articulate'],
  ['library', '/library', 'Vừa lưu'],
  ['advanced', '/advanced', 'Flashcard local'],
  ['profile', '/profile', 'Từ đã lưu'],
]) {
  test(`${name} renders in dark mode without runtime errors`, async ({ page }, testInfo) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto(path);
    await expect(page.getByText(text, { exact: true }).first()).toBeVisible();
    expect(errors).toEqual([]);

    await captureUiArtifacts(page, testInfo, `dark-${name}`);
  });
}
