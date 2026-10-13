import { expect, test } from '@playwright/test';

// Web PDF import loads pdf.js as a native ES module (Metro cannot bundle it); this guards that path.
test('Reader imports a digital PDF on web', async ({ page }) => {
  await page.goto('/advanced');
  await page.getByText('Đọc sách kèm tra từ', { exact: true }).first().click();

  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Nhập file' }).click();
  await (await fileChooserPromise).setFiles('tests/fixtures/reader-pdf/digital-simple.pdf');

  await expect(page.getByText('digital-simple', { exact: true }).first()).toBeVisible({ timeout: 30_000 });
});
