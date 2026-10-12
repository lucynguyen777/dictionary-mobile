// Camera OCR lookup: take or pick a photo → on-device OCR → words the user can look up.
// Image source and OCR engine are interfaces (data/cameraOcrRuntime.ts wires expo-image-picker and
// MLKit), so cancel, permission and unavailable-engine paths are testable without a device.
import { OcrEngineUnavailableError, extractOcrLookupCandidates, type OcrEngine } from './ocrEngine';

export type ImageSourceKind = 'camera' | 'library';

export type ImageSource = {
  pick: (kind: ImageSourceKind) => Promise<
    | { status: 'picked'; uri: string }
    | { status: 'cancelled' }
    | { canAskAgain?: boolean; status: 'permission-denied' }
  >;
};

export type CameraOcrLookupResult =
  | { candidates: string[]; imageUri: string; status: 'ok'; text: string }
  | { message: string; status: 'cancelled' | 'permission-denied' | 'unavailable' | 'no-text' | 'error' };

export async function recognizeLookupWordsFromImage({
  engine,
  imageSource,
  kind,
  languageCode,
}: {
  engine: OcrEngine | null;
  imageSource: ImageSource;
  kind: ImageSourceKind;
  languageCode: string;
}): Promise<CameraOcrLookupResult> {
  if (!engine || !(await engine.isAvailable())) {
    return { message: 'Bản cài đặt này chưa có bộ nhận dạng chữ trên thiết bị (cần bản dev-client/native).', status: 'unavailable' };
  }

  const picked = await imageSource.pick(kind);
  if (picked.status === 'cancelled') return { message: '', status: 'cancelled' };
  if (picked.status === 'permission-denied') {
    const what = kind === 'camera' ? 'camera' : 'thư viện ảnh';
    return {
      message: picked.canAskAgain === false
        ? `Quyền truy cập ${what} đã bị tắt. Bật lại trong Cài đặt của thiết bị.`
        : `Cần quyền truy cập ${what} để nhận dạng chữ.`,
      status: 'permission-denied',
    };
  }

  try {
    const result = await engine.recognizeText({ imageUri: picked.uri, languageCode });
    const candidates = extractOcrLookupCandidates(result);
    if (!result.text.trim() || !candidates.length) {
      return { message: 'Không tìm thấy chữ trong ảnh. Chụp gần hơn, đủ sáng và giữ máy thẳng.', status: 'no-text' };
    }
    return { candidates, imageUri: picked.uri, status: 'ok', text: result.text };
  } catch (error) {
    if (error instanceof OcrEngineUnavailableError) return { message: error.message, status: 'unavailable' };
    return { message: 'Không nhận dạng được chữ trong ảnh. Thử lại với ảnh khác.', status: 'error' };
  }
}
