import { expect, test } from '@playwright/test';

// The proxy is faked at the network layer so the spec exercises the app's SSE parsing and
// quota display without provider keys. Production smoke against OpenAI stays a manual step.
async function mockQuota(page, daily) {
  await page.route('**/backend-proxy/proxy/quota', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        aiChat: { daily, dailyLimit: 25, monthly: daily, monthlyLimit: 500 },
        translation: { daily: 0, dailyLimit: 20000, monthly: 0, monthlyLimit: 200000 },
      }),
    })
  );
}

test('AI Tutor streams a reply and refreshes the daily quota', async ({ page }) => {
  let quotaCalls = 0;
  await page.route('**/backend-proxy/proxy/quota', (route) => {
    quotaCalls += 1;
    return route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        aiChat: { daily: quotaCalls === 1 ? 2 : 3, dailyLimit: 25, monthly: 3, monthlyLimit: 500 },
        translation: null,
      }),
    });
  });
  let requestBody = null;
  await page.route('**/backend-proxy/proxy/ai/chat', (route) => {
    requestBody = route.request().postDataJSON();
    return route.fulfill({
      contentType: 'text/event-stream; charset=utf-8',
      body: [
        'data: {"delta":"Great question! "}\n\n',
        'data: {"delta":"Let\'s talk about travel."}\n\n',
        'data: {"done":true,"provider":"openai","totalTokens":20}\n\n',
      ].join(''),
    });
  });

  await page.goto('/ai-assistant');
  await expect(page.getByText('Hôm nay đã dùng 2/25 tin nhắn')).toBeVisible();

  await page.getByPlaceholder('Nhập tin nhắn bằng tiếng Anh...').fill('Can we talk about travel?');
  await page.getByRole('button', { name: 'Gửi tin nhắn' }).click();

  await expect(page.getByText("Great question! Let's talk about travel.")).toBeVisible();
  await expect(page.getByText('Hôm nay đã dùng 3/25 tin nhắn')).toBeVisible();
  expect(requestBody).toMatchObject({ goal: 'conversation', stream: true });
  expect(requestBody.messages.at(-1)).toEqual({ content: 'Can we talk about travel?', role: 'user' });
});

test('AI Tutor explains a reached daily limit', async ({ page }) => {
  await mockQuota(page, 25);
  await page.route('**/backend-proxy/proxy/ai/chat', (route) =>
    route.fulfill({
      status: 429,
      contentType: 'application/json',
      body: JSON.stringify({ error: { code: 'quota_exceeded', message: 'Daily ai-chat quota exceeded.' } }),
    })
  );

  await page.goto('/ai-assistant');
  await page.getByPlaceholder('Nhập tin nhắn bằng tiếng Anh...').fill('One more message please');
  await page.getByRole('button', { name: 'Gửi tin nhắn' }).click();

  await expect(page.getByText('Bạn đã dùng hết lượt hội thoại AI hôm nay. Thử lại vào ngày mai.')).toBeVisible();
});

test('AI Tutor can stop a pending reply without an error', async ({ page }) => {
  await mockQuota(page, 1);
  let releaseReply;
  const replyHeld = new Promise((resolve) => {
    releaseReply = resolve;
  });
  await page.route('**/backend-proxy/proxy/ai/chat', async (route) => {
    await replyHeld;
    await route.abort().catch(() => undefined);
  });

  await page.goto('/ai-assistant');
  await page.getByPlaceholder('Nhập tin nhắn bằng tiếng Anh...').fill('Tell me a long story');
  await page.getByRole('button', { name: 'Gửi tin nhắn' }).click();

  const stopButton = page.getByRole('button', { name: 'Dừng trả lời' });
  await expect(stopButton).toBeVisible();
  await expect(page.getByLabel('AI đang trả lời')).toBeVisible();
  await stopButton.click();

  await expect(page.getByRole('button', { name: 'Gửi tin nhắn' })).toBeVisible();
  await expect(page.getByLabel('AI đang trả lời')).toHaveCount(0);
  await expect(page.getByText('AI Tutor tạm thời không phản hồi', { exact: false })).toHaveCount(0);
  await expect(page.getByText('Tell me a long story')).toBeVisible();
  releaseReply();
});
