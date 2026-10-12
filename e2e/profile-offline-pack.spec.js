import { expect, test } from '@playwright/test';

import { captureUiArtifacts } from './artifacts.js';

test('Profile offline pack status renders and captures UI artifacts', async ({ page }, testInfo) => {
  await page.goto('/profile');
  // Offline packs live in the settings drawer under "Riêng tư".
  await page.getByLabel('Mở cài đặt').click();
  await page.getByLabel('Mở Riêng tư').click();

  await expect(page.getByText('Gói từ điển offline', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Builder sẵn sàng', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('English · pack mẫu (2 mục từ)', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Chưa tải', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Chờ native runtime', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Pack URL/checksum đã sẵn sàng, nhưng SQLite import chỉ bật trên native runtime.').first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Tải English offline pack/ })).toBeDisabled();

  await captureUiArtifacts(page, testInfo, 'profile-offline-pack');
});

test('Profile edits are saved locally and survive a reload', async ({ page }) => {
  await page.goto('/profile');
  await page.getByLabel('Mở cài đặt').click();
  await page.getByLabel('Mở Tài khoản').click();
  await page.getByPlaceholder('Tên hiển thị').fill('Lan Anh');
  await page.getByPlaceholder('username').fill('lananh');
  await page.getByText('Lưu thay đổi', { exact: true }).click();

  await page.reload();
  await expect(page.getByText('Lan Anh', { exact: true }).first()).toBeVisible();
});

test('Profile notification preferences are stored on the device', async ({ page }) => {
  await page.goto('/profile');
  await page.getByLabel('Mở cài đặt').click();
  await page.getByLabel('Mở Riêng tư').click();
  await expect(page.getByText('Nhắc học mỗi ngày', { exact: true })).toBeVisible();

  const reminderTime = page.getByPlaceholder('20:00');
  await reminderTime.fill('07:30');
  await reminderTime.blur();
  await expect(page.getByText('Đã lưu tùy chọn thông báo local.').first()).toBeVisible();

  await page.reload();
  await page.getByLabel('Mở cài đặt').click();
  await page.getByLabel('Mở Riêng tư').click();
  await expect(page.getByPlaceholder('20:00')).toHaveValue('07:30');
});

test('Deleting the cloud account asks for sign-in first', async ({ page }) => {
  await page.goto('/profile');
  await page.getByLabel('Mở cài đặt').click();
  await page.getByLabel('Mở Tài khoản').click();
  // A dialog opened by a click blocks that click until it is handled, so handle it first.
  let message = '';
  page.once('dialog', async (dialog) => {
    message = dialog.message();
    await dialog.accept();
  });
  await page.getByText('Xóa tài khoản cloud', { exact: true }).click();
  await expect.poll(() => message).toContain('Đăng nhập tài khoản cloud cần xóa');
});
