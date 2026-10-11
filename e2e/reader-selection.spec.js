import { expect, test } from '@playwright/test';

import { captureUiArtifacts } from './artifacts.js';

const paragraph = 'The quick brown fox jumps over the lazy dog near the quiet river bank.';
// ~6,000 words across 400 paragraphs: large enough to expose per-word rendering costs.
const longContent = Array.from({ length: 400 }, (_, index) => `${index + 1}. ${paragraph}`).join('\n');

test.beforeEach(async ({ page }) => {
  await page.addInitScript((content) => {
    const at = '2026-10-01T00:00:00.000Z';
    window.localStorage.setItem('dictionary-mobile.reader.v1', JSON.stringify({
      documents: [{ content, createdAt: at, id: 'doc-long', sourceFormat: 'txt', title: 'Long story', updatedAt: at }],
      selectedDocumentId: 'doc-long',
      settings: {},
    }));
  }, longContent);
});

test('Reader renders a long document and builds a phrase selection from taps', async ({ page }, testInfo) => {
  const started = Date.now();
  await page.goto('/reader');
  await expect(page.getByText('Long story', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('quick', { exact: true }).first()).toBeVisible();
  const renderMs = Date.now() - started;
  testInfo.annotations.push({ type: 'render-ms', description: String(renderMs) });

  await page.getByText('quick', { exact: true }).first().click();
  await expect(page.getByText('quick', { exact: true }).nth(1)).toBeVisible();
  await page.getByText('brown', { exact: true }).first().click();

  await expect(page.getByText('quick brown', { exact: true })).toBeVisible();

  await captureUiArtifacts(page, testInfo, 'reader-selection');
});

test('Reader progress is an adjustable slider for assistive technology', async ({ page }) => {
  await page.goto('/reader');
  const slider = page.getByRole('slider', { name: 'Tiến trình đọc' });
  await expect(slider).toHaveAttribute('aria-valuenow', '0');
  await expect(slider).toHaveAttribute('aria-valuetext', '0%');
});

test('Reader saves a highlighted phrase and makes a flashcard from it', async ({ page }) => {
  await page.goto('/reader');
  await page.getByText('lazy', { exact: true }).first().click();
  await page.getByText('dog', { exact: true }).first().click();
  await expect(page.getByText('lazy dog', { exact: true })).toBeVisible();

  await page.getByText('Lưu', { exact: true }).click();
  await expect(page.getByText('Đã lưu cụm từ "lazy dog".')).toBeVisible();
  await page.getByText('Tạo thẻ', { exact: true }).click();
  await expect(page.getByText('Đã tạo flashcard cho "lazy dog".')).toBeVisible();
});

test('Reader audio panel and page buttons respond', async ({ page }) => {
  await page.goto('/reader');
  const slider = page.getByRole('slider', { name: 'Tiến trình đọc' });
  await page.getByRole('button', { name: 'Trang sau' }).click();
  await expect.poll(async () => Number(await slider.getAttribute('aria-valuenow'))).toBeGreaterThan(0);

  await page.getByRole('button', { name: 'Audio' }).click();
  await expect(page.getByRole('button', { name: 'Đọc to' })).toBeVisible();
  await expect(page.getByRole('slider', { name: 'Vị trí đọc to' })).toHaveAttribute('aria-valuetext', /^Câu 1\/\d+$/);
});
