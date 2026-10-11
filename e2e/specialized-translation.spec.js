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
    examples: [],
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

test('Specialized translation sends the most similar sentence pairs from the sentence memory', async ({ page }) => {
  let requestBody = null;
  await page.route('**/backend-proxy/proxy/translate/specialized', (route) => {
    requestBody = route.request().postDataJSON();
    return route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ appliedTerms: [], characterCount: 37, examplesUsed: 1, provider: 'openai', translatedText: 'Bệnh nhân đã được xuất viện hôm qua.' }),
    });
  });

  await page.goto('/advanced');
  await page.getByText('Dịch chuyên ngành', { exact: true }).first().click();
  await page.getByText('Y khoa', { exact: true }).click();
  await page.getByLabel('Câu mẫu').fill([
    'The patient was discharged. → Bệnh nhân đã được xuất viện.',
    'The contract is terminated. → Hợp đồng bị chấm dứt.',
  ].join('\n'));
  await expect(page.getByText('Câu mẫu Y khoa (2 câu)', { exact: false })).toBeVisible();

  await page.getByLabel('Văn bản nguồn').fill('The patient was discharged yesterday.');
  await expect(page.getByText('Câu mẫu tương tự (1)')).toBeVisible();
  await page.getByRole('button', { name: 'Dịch theo glossary' }).click();

  await expect(page.getByText('Đã áp dụng 0 thuật ngữ và 1 câu mẫu', { exact: false })).toBeVisible();
  expect(requestBody.examples).toEqual([{ source: 'The patient was discharged.', target: 'Bệnh nhân đã được xuất viện.' }]);

  // Việt → Anh uses the same pairs in the other direction.
  await page.getByText('Việt → Anh', { exact: true }).click();
  await page.getByLabel('Văn bản nguồn').fill('Hợp đồng bị chấm dứt vào tháng trước.');
  await page.getByRole('button', { name: 'Dịch theo glossary' }).click();
  await expect.poll(() => requestBody.sourceLang).toBe('vi');
  expect(requestBody.examples).toEqual([{ source: 'Hợp đồng bị chấm dứt.', target: 'The contract is terminated.' }]);
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

test('Specialized translation imports a two-column CSV glossary', async ({ page }) => {
  await page.goto('/advanced');
  await page.getByText('Dịch chuyên ngành', { exact: true }).first().click();
  await page.getByText('Pháp lý', { exact: true }).click();
  await page.getByLabel('Glossary').fill('tort → sai phạm dân sự');

  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Nhập CSV/TSV/DOCX/PDF' }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    buffer: Buffer.from('term,translation\nplaintiff,nguyên đơn\n"tort","trùng"\ndefendant,bị đơn\n', 'utf8'),
    mimeType: 'text/csv',
    name: 'legal.csv',
  });

  await expect(page.getByLabel('Glossary')).toHaveValue('tort → sai phạm dân sự\nplaintiff → nguyên đơn\ndefendant → bị đơn');
  await expect(page.getByText('Glossary Pháp lý (3 thuật ngữ)', { exact: false })).toBeVisible();
});

test('Specialized translation imports glossary lines from a PDF', async ({ page }) => {
  await page.goto('/advanced');
  await page.getByText('Dịch chuyên ngành', { exact: true }).first().click();
  await page.getByText('CNTT', { exact: true }).click();

  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Nhập CSV/TSV/DOCX/PDF' }).click();
  await (await fileChooserPromise).setFiles('tests/fixtures/reader-pdf/glossary-arrows.pdf');

  await expect(page.getByLabel('Glossary')).toHaveValue('MRI → chup cong huong tu\nECG → dien tam do', { timeout: 30_000 });
});
