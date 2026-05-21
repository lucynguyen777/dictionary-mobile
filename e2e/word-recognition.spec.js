import { expect, test } from '@playwright/test';

test('Word screen exposes Voice and OCR recognition prototype entry points', async ({ page }) => {
  await page.goto('/word?word=articulate&sourceLang=en&targetLang=en');

  await expect(page.getByLabel('Open voice search prototype')).toBeVisible();
  await expect(page.getByLabel('Open OCR lookup prototype')).toBeVisible();

  await page.getByLabel('Open voice search prototype').click();
  await expect(page.getByText('Voice Search', { exact: true })).toBeVisible();
  await expect(page.getByText('Sẵn sàng ghi âm', { exact: true })).toBeVisible();
  await page.getByLabel('Close recognition prototype').click();

  await page.getByLabel('Open OCR lookup prototype').click();
  await expect(page.getByText('OCR Lookup', { exact: true })).toBeVisible();
  await expect(page.getByText('Sẵn sàng chọn ảnh', { exact: true })).toBeVisible();
});
