import { describe, expect, it } from 'vitest';

import {
  createAudioCapturePreview,
  createImageCapturePreview,
  formatCapturePreviewMeta,
} from '../data/recognitionCapture';

describe('recognition capture preview utilities', () => {
  it('builds audio preview metadata from a local recording URI', () => {
    const preview = createAudioCapturePreview({
      uri: 'file:///cache/voice-note.m4a?token=1',
      durationMs: 5320,
      capturedAt: '2026-05-21T10:00:00.000Z',
      sizeBytes: 1536,
    });

    expect(preview).toMatchObject({
      kind: 'audio',
      uri: 'file:///cache/voice-note.m4a?token=1',
      fileName: 'voice-note.m4a',
      capturedAt: '2026-05-21T10:00:00.000Z',
      source: 'microphone',
    });
    expect(formatCapturePreviewMeta(preview!)).toBe('Audio · m4a · 0:05 · 2 KB');
  });

  it('builds image preview metadata for library assets', () => {
    const preview = createImageCapturePreview({
      uri: 'file:///images/card.JPG',
      width: 1280,
      height: 720,
      capturedAt: '2026-05-21T10:01:00.000Z',
      sizeBytes: 1_572_864,
      source: 'library',
    });

    expect(preview).toMatchObject({
      kind: 'image',
      fileName: 'card.JPG',
      source: 'library',
      width: 1280,
      height: 720,
    });
    expect(formatCapturePreviewMeta(preview!)).toBe('Image · jpg · 1280x720 · 1.5 MB');
  });

  it('returns null when capture URI is missing', () => {
    expect(createAudioCapturePreview({ uri: null })).toBeNull();
    expect(createImageCapturePreview({ uri: undefined, source: 'camera' })).toBeNull();
  });
});
