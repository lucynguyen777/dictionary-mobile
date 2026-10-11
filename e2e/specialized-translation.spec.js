import { expect, test } from '@playwright/test';

// The proxy is faked at the network layer; the spec checks the glossary flow end to end in the UI.
test('Specialized translation applies the device glossary and keeps it after reload', async ({ page }) => {
  let requestBody = null;
  await page.route('**/backend-proxy/proxy/translate/specialized', (route) => {
    requestBody = route.request().postDataJSON();
    return route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        appliedTerms: [{ sourceTerm: 'MRI', targetTerm: 'cộng hưởng từ' }],
        characterCount: 34,
        provider: 'openai',
        translatedText: 'Bệnh nhân đã được chụp cộng hưởng từ.',
      }),
    });
  });

  await page.goto('/advanced');
  await page.getByText('Dịch chuyên ngành', { exact: true }).first().click();
  await page.getByText('Y khoa', { exact: true }).click();

  await page.getByLabel('Glossary').fill('MRI → cộng hưởng từ\nECG → điện tâm đồ\nbroken line');
  await expect(page.getByText('Bỏ qua dòng 3', { exact: false })).toBeVisible();
  await page.getByLabel('Văn bản nguồn').fill('The patient underwent an MRI scan.');
  await expect(page.getByText('MRI → cộng hưởng từ', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Dịch theo glossary' }).click();
  await expect(page.getByText('Bệnh nhân đã được chụp cộng hưởng từ.')).toBeVisible();
  await expect(page.getByText('Đã áp dụng 1 thuật ngữ', { exact: false })).toBeVisible();
  expect(requestBody).toEqual({
    domainId: 'medical',
    glossary: [
      { sourceTerm: 'MRI', targetTerm: 'cộng hưởng từ' },
      { sourceTerm: 'ECG', targetTerm: 'điện tâm đồ' },
    ],
    sourceLang: 'en',
    sourceText: 'The patient underwent an MRI scan.',
    targetLang: 'vi',
  });

  await page.waitForTimeout(600);
  await page.reload();
  await page.getByText('Dịch chuyên ngành', { exact: true }).first().click();
  await page.getByText('Y khoa', { exact: true }).click();
  await expect(page.getByLabel('Glossary')).toHaveValue('MRI → cộng hưởng từ\nECG → điện tâm đồ\nbroken line');
  await page.getByText('Chung', { exact: true }).click();
  await expect(page.getByLabel('Glossary')).toHaveValue('');
});

test('Specialized translation explains a missing sign-in', async ({ page }) => {
  await page.route('**/backend-proxy/proxy/translate/specialized', (route) =>
    route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: { code: 'unauthorized' } }) })
  );

  await page.goto('/advanced');
  await page.getByText('Dịch chuyên ngành', { exact: true }).first().click();
  await page.getByLabel('Văn bản nguồn').fill('Hello world');
  await page.getByRole('button', { name: 'Dịch theo glossary' }).click();

  await expect(page.getByText('Đăng nhập cloud để dùng dịch chuyên ngành.')).toBeVisible();
});
