import { expect, test } from '@playwright/test';

import { captureUiArtifacts } from './artifacts.js';

test('Library creates a folder and opens its detail screen', async ({ page }, testInfo) => {
  await page.goto('/library');

  await page.getByLabel('Thêm bộ từ').click();
  await page.getByText('Tạo mới', { exact: true }).click();
  await page.getByPlaceholder('Tên bộ từ').fill('E2E Trip');
  await page.getByText('Tạo bộ từ', { exact: true }).click();

  await expect(page.getByText('E2E Trip', { exact: true }).first()).toBeVisible();
  await page.getByText('E2E Trip', { exact: true }).first().click();

  await expect(page).toHaveURL(/\/folder\//);
  // The Library tab stays mounted underneath the pushed route, so only match visible text.
  await expect(page.getByText('E2E Trip', { exact: true }).locator('visible=true').first()).toBeVisible();
  await expect(page.getByText('Bộ từ đang trống', { exact: true })).toBeVisible();

  await captureUiArtifacts(page, testInfo, 'library-create-folder');
});

test('A word saved as favorite appears in Library and Home stats', async ({ page }, testInfo) => {
  await page.goto('/word?word=articulate&sourceLang=en&targetLang=en');
  await expect(page.getByText('articulate', { exact: true }).first()).toBeVisible();

  await page.getByLabel('Thêm vào yêu thích').click();
  await expect(page.getByLabel('Bỏ khỏi yêu thích')).toBeVisible();

  await page.goto('/library');
  await expect(page.getByText('articulate', { exact: true }).first()).toBeVisible();

  await page.goto('/');
  await expect(page.getByText('Từ đã lưu', { exact: true })).toBeVisible();
  await expect(page.getByText('1', { exact: true }).first()).toBeVisible();

  await captureUiArtifacts(page, testInfo, 'favorite-word');
});

test('Library imports a CSV into a new folder', async ({ page }) => {
  await page.goto('/library');
  await page.getByLabel('Thêm bộ từ').click();

  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByText('Tải lên file', { exact: true }).click();
  await (await fileChooserPromise).setFiles({
    buffer: Buffer.from('word,definition\nharbor,a sheltered port\nlantern,a portable light\n', 'utf8'),
    mimeType: 'text/csv',
    name: 'Coast words.csv',
  });

  await expect(page.getByText('Coast words.csv · 2 từ hợp lệ', { exact: false })).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByText('Import vào bộ từ', { exact: true }).click();
  await expect(page.getByText('Coast words', { exact: true }).first()).toBeVisible();
});

test('Library renames a folder and changes its color from the folder menu', async ({ page }) => {
  await page.goto('/library');
  await page.getByLabel('Thêm bộ từ').click();
  await page.getByText('Tạo mới', { exact: true }).click();
  await page.getByPlaceholder('Tên bộ từ').fill('Draft folder');
  await page.getByText('Tạo bộ từ', { exact: true }).click();

  await page.getByLabel('Tùy chọn bộ từ Draft folder').click();
  await page.getByText('Đổi tên', { exact: true }).click();
  await page.getByPlaceholder('Tên mới cho bộ từ').fill('Renamed folder');
  await page.getByText('Lưu', { exact: true }).click();
  await expect(page.getByText('Renamed folder', { exact: true }).first()).toBeVisible();

  await page.getByLabel('Tùy chọn bộ từ Renamed folder').click();
  await page.getByText('Thay đổi màu sắc', { exact: true }).click();
  await page.getByPlaceholder("Ghi chú cho màu này (ví dụ: 'Học vựng hằng ngày')").fill('Weekly review');
  await page.getByText('Lưu', { exact: true }).click();
  await expect(page.getByText('Chọn màu cho bộ từ')).toHaveCount(0);
});
