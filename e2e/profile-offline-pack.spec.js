import { expect, test } from '@playwright/test';

import { captureUiArtifacts } from './artifacts.js';

test('Profile offline pack status renders and captures UI artifacts', async ({ page }, testInfo) => {
  await page.goto('/profile');
  // Offline packs live in the settings drawer under "Riêng tư".
  await page.getByLabel('Mở cài đặt').click();
  await page.getByLabel('Mở Riêng tư').click();

  await expect(page.getByText('Gói từ điển offline', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Builder sẵn sàng', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Chưa tải', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Chờ native runtime', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Pack URL/checksum đã sẵn sàng, nhưng SQLite import chỉ bật trên native runtime.').first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Tải English offline pack/ })).toBeDisabled();

  await captureUiArtifacts(page, testInfo, 'profile-offline-pack');
});
