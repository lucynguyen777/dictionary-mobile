// Native wiring for camera OCR lookup: expo-image-picker for the photo and MLKit text recognition
// (dev-client only). Both load lazily so Expo Go and web fall back to "unavailable".
import type { ImageSource } from './cameraOcrLookup';
import type { OcrEngine } from './ocrEngine';
import { createMLKitOCRProvider, type MLKitRecognizer } from './providers/MLKitOCRProvider';

function loadMLKitRecognizer(): MLKitRecognizer | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { recognizeText } = require('@infinitered/react-native-mlkit-text-recognition') as {
      recognizeText: (imagePath: string) => Promise<{ blocks: { lines: { text: string }[]; text: string }[]; text: string }>;
    };
    return {
      // MLKit frames are pixel rectangles of unknown image size; lookup only needs the text.
      recognizeText: async (imageUri) => {
        const result = await recognizeText(imageUri);
        return {
          blocks: result.blocks.map((block) => ({ lines: block.lines.map((line) => ({ text: line.text })), text: block.text })),
          text: result.text,
        };
      },
    };
  } catch {
    return undefined;
  }
}

export function createNativeOcrEngine(): OcrEngine {
  return createMLKitOCRProvider(loadMLKitRecognizer());
}

export function createExpoImageSource(): ImageSource {
  return {
    async pick(kind) {
      const ImagePicker = await import('expo-image-picker');
      const permission = kind === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return { canAskAgain: permission.canAskAgain, status: 'permission-denied' };

      const options = { allowsEditing: true, mediaTypes: ['images' as const], quality: 0.8 };
      const result = kind === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      const uri = result.canceled ? null : result.assets?.[0]?.uri;
      return uri ? { status: 'picked', uri } : { status: 'cancelled' };
    },
  };
}
