import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

function sanitizePathSegment(value) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'local';
}

test('Word Detail screen renders and captures UI artifacts', async ({ page }, testInfo) => {
  const branch = sanitizePathSegment(
    process.env.UI_TEST_BRANCH || process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || 'local'
  );
  const artifactDir = path.join(
    process.cwd(),
    'artifacts',
    'ui-tests',
    branch,
    testInfo.project.name,
    'word-detail'
  );

  await fs.mkdir(artifactDir, { recursive: true });
  await page.goto('/word?word=articulate&sourceLang=en&targetLang=en');

  await expect(page.getByText('articulate', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('diễn đạt rõ ràng', { exact: true }).first()).toBeVisible();

  for (const tab of ['Meaning', 'Synonyms', 'Collocation & Idiom', 'Conjugation', 'Etymology']) {
    await expect(page.getByText(tab, { exact: true }).first()).toBeVisible();
  }

  await page.screenshot({
    fullPage: true,
    path: path.join(artifactDir, 'screenshot.png'),
  });

  await fs.writeFile(path.join(artifactDir, 'page.dom.html'), await page.content(), 'utf8');
  await fs.writeFile(path.join(artifactDir, 'visible-text.txt'), await page.locator('body').innerText(), 'utf8');

  await testInfo.attach('word-detail-screenshot', {
    contentType: 'image/png',
    path: path.join(artifactDir, 'screenshot.png'),
  });
});
