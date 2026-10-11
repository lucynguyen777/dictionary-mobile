import { expect, test } from '@playwright/test';

// Runs only against a dev server started with EXPO_PUBLIC_ENABLE_NATIVE_RECOGNITION=true
// (the EAS development profile sets it). Production builds keep the "later version" state that
// e2e/word-recognition.spec.js covers.
const baseURL = process.env.RECOGNITION_BASE_URL;
test.skip(!baseURL, 'Set RECOGNITION_BASE_URL to a dev server started with EXPO_PUBLIC_ENABLE_NATIVE_RECOGNITION=true');

// A scripted Web Speech API: expo-speech-recognition's web module drives it like Chrome's recognizer.
async function installFakeSpeech(page, transcript) {
  await page.addInitScript((spoken) => {
    class FakeRecognition extends EventTarget {
      start() {
        setTimeout(() => {
          const result = Object.assign(new Event('result'), {
            resultIndex: 0,
            results: [Object.assign([{ confidence: 0.9, transcript: spoken }], { isFinal: true })],
          });
          this.dispatchEvent(result);
          this.dispatchEvent(new Event('end'));
        }, 300);
      }
      stop() {
        this.dispatchEvent(new Event('end'));
      }
      abort() {
        this.dispatchEvent(Object.assign(new Event('error'), { error: 'aborted', message: '' }));
      }
    }
    window.webkitSpeechRecognition = FakeRecognition;
  }, transcript);
}

test('voice search turns speech into a lookup', async ({ page }) => {
  await installFakeSpeech(page, 'articulate');
  await page.goto(`${baseURL}/word?word=book&sourceLang=en&targetLang=en`);
  await page.getByPlaceholder('Tìm từ, nghĩa, chủ đề...').focus();

  await page.getByRole('button', { name: 'Tìm bằng giọng nói' }).click();
  await page.getByRole('button', { name: 'Tra từ articulate' }).click();

  await expect(page.getByText('articulate', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tra từ articulate' })).toHaveCount(0);
});

test('voice search says so when the browser has no speech recognizer', async ({ page }) => {
  await page.addInitScript(() => {
    delete window.webkitSpeechRecognition;
    delete window.SpeechRecognition;
  });
  await page.goto(`${baseURL}/word?word=book&sourceLang=en&targetLang=en`);
  await page.getByPlaceholder('Tìm từ, nghĩa, chủ đề...').focus();
  await page.getByRole('button', { name: 'Tìm bằng giọng nói' }).click();

  await expect(page.getByText('Thiết bị hoặc bản cài đặt này chưa hỗ trợ tìm bằng giọng nói.')).toBeVisible();
});

test('camera OCR explains that web has no on-device text recognition', async ({ page }) => {
  await page.goto(`${baseURL}/word?word=book&sourceLang=en&targetLang=en`);
  await page.getByPlaceholder('Tìm từ, nghĩa, chủ đề...').focus();
  await page.getByRole('button', { name: 'Tra cứu qua ảnh (OCR)' }).click();
  await page.getByRole('button', { name: 'Chọn ảnh' }).click();

  await expect(page.getByText('chưa có bộ nhận dạng chữ trên thiết bị', { exact: false })).toBeVisible();
});
