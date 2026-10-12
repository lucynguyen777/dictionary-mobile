import { expect, test } from '@playwright/test';

// Plan 3.9: a saved word becomes a flashcard in Training and can be reviewed (SM-2).
test('A saved word becomes a flashcard that can be studied and reviewed', async ({ page }) => {
  await page.goto('/word?word=articulate&sourceLang=en&targetLang=en');
  await expect(page.getByText('articulate', { exact: true }).first()).toBeVisible();
  await page.getByLabel('Thêm vào yêu thích').click();
  await expect(page.getByLabel('Bỏ khỏi yêu thích')).toBeVisible();

  await page.goto('/advanced');
  await page.getByText('Flashcard local', { exact: true }).first().click();
  await page.getByText('Manage', { exact: true }).click();
  await page.getByText('Tạo flashcard từ từ đã lưu', { exact: true }).click();
  await page.getByText('Study', { exact: true }).click();

  await expect(page.getByText('Front', { exact: true })).toBeVisible();
  await expect(page.getByText(/· Mới$/).first()).toBeVisible();
  await expect(page.getByText('articulate', { exact: false }).first()).toBeVisible();
  await page.getByText('Front', { exact: true }).click();
  await expect(page.getByText('Back', { exact: true })).toBeVisible();

  const dueCount = async () => Number((await page.getByText(/^\d+ thẻ cần ôn$/).first().textContent())?.split(' ')[0]);
  const dueBefore = await dueCount();
  expect(dueBefore).toBeGreaterThan(0);
  await page.getByText('Tốt', { exact: true }).click();
  // SM-2 schedules a "good" answer for a later day, so the card leaves today's queue.
  await expect.poll(dueCount).toBe(dueBefore - 1);
});
