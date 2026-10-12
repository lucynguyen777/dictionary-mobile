import { expect, test } from '@playwright/test';

// Voice and OCR stay visible but clearly marked as not yet available until the native
// STT/OCR engines pass dev-client smoke; they must not open a prototype with fake results.
test('Word screen marks Voice and OCR lookup as coming in a later version', async ({ page }) => {
  await page.goto('/word?word=articulate&sourceLang=en&targetLang=en');

  await page.getByPlaceholder('Tìm từ, nghĩa, chủ đề...').focus();

  await expect(page.getByLabel('Tìm bằng giọng nói: cập nhật trong phiên bản sau')).toBeVisible();
  await expect(page.getByLabel('Tra cứu qua ảnh (OCR): cập nhật trong phiên bản sau')).toBeVisible();
  await expect(page.getByText('Voice/OCR: Cập nhật trong phiên bản sau · Cần dev-client')).toBeVisible();

  await page.getByLabel('Tra cứu qua ảnh (OCR): cập nhật trong phiên bản sau').click();
  await expect(page.getByText('OCR Lookup', { exact: true })).toHaveCount(0);
});
