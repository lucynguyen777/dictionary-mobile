import { describe, expect, it, vi } from 'vitest';

import { recognizeLookupWordsFromImage, type ImageSource } from '../data/cameraOcrLookup';
import { OcrEngineUnavailableError, type OcrEngine } from '../data/ocrEngine';
import { createMLKitOCRProvider } from '../data/providers/MLKitOCRProvider';

const picked: ImageSource = { pick: async () => ({ status: 'picked', uri: 'file:///photo.jpg' }) };

describe('camera OCR lookup', () => {
  it('returns words from the recognized text', async () => {
    const engine = createMLKitOCRProvider({
      recognizeText: async () => ({ blocks: [{ lines: [{ text: 'The patient had an MRI' }] }], text: 'The patient had an MRI' }),
    });
    const result = await recognizeLookupWordsFromImage({ engine, imageSource: picked, kind: 'camera', languageCode: 'en' });
    expect(result).toMatchObject({ imageUri: 'file:///photo.jpg', status: 'ok' });
    expect(result.status === 'ok' && result.candidates).toEqual(expect.arrayContaining(['patient', 'MRI']));
  });

  it('does not open the camera when no engine is available', async () => {
    const pick = vi.fn();
    const result = await recognizeLookupWordsFromImage({ engine: createMLKitOCRProvider(), imageSource: { pick }, kind: 'camera', languageCode: 'en' });
    expect(result.status).toBe('unavailable');
    expect(pick).not.toHaveBeenCalled();
    expect((await recognizeLookupWordsFromImage({ engine: null, imageSource: { pick }, kind: 'library', languageCode: 'en' })).status).toBe('unavailable');
  });

  it('handles cancel and denied permissions', async () => {
    const engine = createMLKitOCRProvider({ recognizeText: async () => ({ text: 'x' }) });
    expect((await recognizeLookupWordsFromImage({ engine, imageSource: { pick: async () => ({ status: 'cancelled' }) }, kind: 'camera', languageCode: 'en' })).status).toBe('cancelled');
    const denied = await recognizeLookupWordsFromImage({ engine, imageSource: { pick: async () => ({ canAskAgain: false, status: 'permission-denied' }) }, kind: 'camera', languageCode: 'en' });
    expect(denied).toMatchObject({ status: 'permission-denied' });
    expect(denied.status !== 'ok' && denied.message).toContain('Cài đặt');
  });

  it('explains blank images and engine failures', async () => {
    const blank = createMLKitOCRProvider({ recognizeText: async () => ({ blocks: [], text: '  ' }) });
    expect((await recognizeLookupWordsFromImage({ engine: blank, imageSource: picked, kind: 'library', languageCode: 'en' })).status).toBe('no-text');

    const broken: OcrEngine = { id: 'x', isAvailable: () => true, label: 'x', recognizeText: async () => { throw new Error('native crash'); } };
    expect((await recognizeLookupWordsFromImage({ engine: broken, imageSource: picked, kind: 'library', languageCode: 'en' })).status).toBe('error');

    const gone: OcrEngine = { ...broken, recognizeText: async () => { throw new OcrEngineUnavailableError('gone'); } };
    expect((await recognizeLookupWordsFromImage({ engine: gone, imageSource: picked, kind: 'library', languageCode: 'en' }))).toEqual({ message: 'gone', status: 'unavailable' });
  });
});
