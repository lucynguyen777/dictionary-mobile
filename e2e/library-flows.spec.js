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
