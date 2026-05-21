export type RecognitionCaptureKind = 'audio' | 'image';

export type RecognitionCapturePreview = {
  kind: RecognitionCaptureKind;
  uri: string;
  fileName: string;
  capturedAt: string;
  durationMs?: number;
  sizeBytes?: number;
  width?: number;
  height?: number;
  source: 'microphone' | 'camera' | 'library';
};

export function createAudioCapturePreview({
  uri,
  durationMs,
  capturedAt = new Date().toISOString(),
  sizeBytes,
}: {
  uri: string | null | undefined;
  durationMs?: number;
  capturedAt?: string;
  sizeBytes?: number;
}): RecognitionCapturePreview | null {
  if (!uri) return null;

  return {
    kind: 'audio',
    uri,
    fileName: getFileNameFromUri(uri, 'recording.m4a'),
    capturedAt,
    durationMs,
    sizeBytes,
    source: 'microphone',
  };
}

export function createImageCapturePreview({
  uri,
  width,
  height,
  capturedAt = new Date().toISOString(),
  sizeBytes,
  source,
}: {
  uri: string | null | undefined;
  width?: number;
  height?: number;
  capturedAt?: string;
  sizeBytes?: number;
  source: 'camera' | 'library';
}): RecognitionCapturePreview | null {
  if (!uri) return null;

  return {
    kind: 'image',
    uri,
    fileName: getFileNameFromUri(uri, 'image.jpg'),
    capturedAt,
    width,
    height,
    sizeBytes,
    source,
  };
}

export function formatCapturePreviewMeta(preview: RecognitionCapturePreview) {
  const parts = [
    preview.kind === 'audio' ? 'Audio' : 'Image',
    getFileExtension(preview.fileName),
    preview.kind === 'audio' ? formatDuration(preview.durationMs) : formatDimensions(preview.width, preview.height),
    formatFileSize(preview.sizeBytes),
  ].filter(Boolean);

  return parts.join(' · ');
}

function getFileNameFromUri(uri: string, fallback: string) {
  const cleanUri = uri.split('?')[0]?.split('#')[0] ?? uri;
  const fileName = cleanUri.split('/').filter(Boolean).pop();

  return fileName || fallback;
}

function getFileExtension(fileName: string) {
  const extension = fileName.split('.').pop();
  if (!extension || extension === fileName) return '';

  return extension.toLocaleLowerCase();
}

function formatDuration(durationMs?: number) {
  if (!durationMs || durationMs < 0) return '';

  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatDimensions(width?: number, height?: number) {
  if (!width || !height) return '';

  return `${Math.round(width)}x${Math.round(height)}`;
}

function formatFileSize(sizeBytes?: number) {
  if (!sizeBytes || sizeBytes < 0) return '';
  if (sizeBytes < 1024) return `${Math.round(sizeBytes)} B`;

  const sizeKb = sizeBytes / 1024;
  if (sizeKb < 1024) return `${Math.round(sizeKb)} KB`;

  return `${(sizeKb / 1024).toFixed(1)} MB`;
}
