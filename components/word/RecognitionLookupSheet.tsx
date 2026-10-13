import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { recognizeLookupWordsFromImage, type CameraOcrLookupResult, type ImageSourceKind } from '@/data/cameraOcrLookup';
import { createExpoImageSource, createNativeOcrEngine } from '@/data/cameraOcrRuntime';
import { createVoiceSearchSession, type VoiceSearchState } from '@/data/voiceSearch';
import { createExpoSpeechEngine } from '@/data/voiceSearchEngine';
import { useToken } from '@/hooks/use-token';

export type RecognitionMode = 'voice' | 'ocr';

type Props = {
  languageCode: string;
  mode: RecognitionMode | null;
  onClose: () => void;
  onSelectWord: (word: string) => void;
};

export default function RecognitionLookupSheet({ languageCode, mode, onClose, onSelectWord }: Props) {
  const { colors, radius } = useToken();
  const styles = useMemo(() => createStyles(colors, radius), [colors, radius]);

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={mode !== null}>
      <Pressable accessibilityLabel="Đóng" onPress={onClose} style={styles.backdrop}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.sheet}>
          {mode === 'voice' ? (
            <VoicePanel languageCode={languageCode} onClose={onClose} onSelectWord={onSelectWord} styles={styles} />
          ) : mode === 'ocr' ? (
            <OcrPanel languageCode={languageCode} onSelectWord={onSelectWord} styles={styles} />
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type Styles = ReturnType<typeof createStyles>;

function VoicePanel({ languageCode, onClose, onSelectWord, styles }: { languageCode: string; onClose: () => void; onSelectWord: (word: string) => void; styles: Styles }) {
  const { colors } = useToken();
  const [state, setState] = useState<VoiceSearchState>({ candidates: [], status: 'idle', transcript: '' });
  const session = useRef<ReturnType<typeof createVoiceSearchSession> | null>(null);

  const start = () => {
    session.current?.cancel();
    session.current = createVoiceSearchSession(createExpoSpeechEngine(), { languageCode, onChange: setState });
    void session.current.start();
  };

  useEffect(() => {
    start();
    return () => session.current?.cancel();
    // Restart only when the lookup language changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languageCode]);

  const isBusy = state.status === 'listening' || state.status === 'requesting-permission';
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Tìm bằng giọng nói</Text>
      {isBusy ? (
        <View style={styles.row}>
          <Ionicons name="mic" size={22} color={colors.accentPrimary} />
          <Text accessibilityLiveRegion="polite" style={styles.body}>
            {state.status === 'requesting-permission' ? 'Đang xin quyền micro...' : state.transcript || 'Đang nghe... hãy nói một từ hoặc cụm từ.'}
          </Text>
        </View>
      ) : null}
      {state.errorMessage ? <Text accessibilityRole="alert" style={styles.error}>{state.errorMessage}</Text> : null}
      <CandidateChips candidates={state.candidates} onSelectWord={onSelectWord} styles={styles} />
      <View style={styles.actions}>
        {state.status === 'listening' ? (
          <SheetButton icon="stop" label="Dừng" onPress={() => session.current?.stop()} primary styles={styles} />
        ) : state.status !== 'unavailable' && state.status !== 'requesting-permission' ? (
          <SheetButton icon="mic-outline" label="Nói lại" onPress={start} primary styles={styles} />
        ) : null}
        <SheetButton icon="close" label="Đóng" onPress={onClose} styles={styles} />
      </View>
    </View>
  );
}

function OcrPanel({ languageCode, onSelectWord, styles }: { languageCode: string; onSelectWord: (word: string) => void; styles: Styles }) {
  const { colors } = useToken();
  const [result, setResult] = useState<CameraOcrLookupResult | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const run = async (kind: ImageSourceKind) => {
    setIsWorking(true);
    setResult(null);
    try {
      setResult(await recognizeLookupWordsFromImage({
        engine: createNativeOcrEngine(),
        imageSource: createExpoImageSource(),
        kind,
        languageCode,
      }));
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Tra cứu qua ảnh</Text>
      <Text style={styles.body}>Chụp hoặc chọn ảnh, cắt gọn vùng chữ, rồi chọn từ cần tra. Ảnh được nhận dạng trên thiết bị.</Text>
      <View style={styles.actions}>
        <SheetButton disabled={isWorking} icon="camera-outline" label="Chụp ảnh" onPress={() => void run('camera')} primary styles={styles} />
        <SheetButton disabled={isWorking} icon="images-outline" label="Chọn ảnh" onPress={() => void run('library')} styles={styles} />
      </View>
      {isWorking ? <ActivityIndicator accessibilityLabel="Đang nhận dạng chữ" color={colors.accentPrimary} /> : null}
      {result && result.status !== 'ok' && result.message ? (
        <Text accessibilityRole="alert" style={styles.error}>{result.message}</Text>
      ) : null}
      {result?.status === 'ok' ? <CandidateChips candidates={result.candidates} onSelectWord={onSelectWord} styles={styles} /> : null}
    </View>
  );
}

function CandidateChips({ candidates, onSelectWord, styles }: { candidates: string[]; onSelectWord: (word: string) => void; styles: Styles }) {
  if (!candidates.length) return null;
  return (
    <View style={styles.chips}>
      {candidates.map((candidate) => (
        <Pressable accessibilityLabel={`Tra từ ${candidate}`} accessibilityRole="button" key={candidate} onPress={() => onSelectWord(candidate)} style={styles.chip}>
          <Text style={styles.chipText}>{candidate}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function SheetButton({ disabled, icon, label, onPress, primary, styles }: {
  disabled?: boolean;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  primary?: boolean;
  styles: Styles;
}) {
  const { colors } = useToken();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, primary ? styles.buttonPrimary : styles.buttonSecondary, disabled && styles.buttonDisabled]}>
      <Ionicons name={icon} size={16} color={primary ? colors.textOnAccent : colors.textPrimary} />
      <Text style={primary ? styles.buttonPrimaryText : styles.buttonSecondaryText}>{label}</Text>
    </Pressable>
  );
}

function createStyles(colors: ReturnType<typeof useToken>['colors'], radius: ReturnType<typeof useToken>['radius']) {
  return StyleSheet.create({
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    backdrop: { backgroundColor: colors.canvasOverlay, flex: 1, justifyContent: 'flex-end' },
    body: { color: colors.textSecondary, flex: 1, fontSize: 14, lineHeight: 20 },
    button: { alignItems: 'center', borderRadius: radius.md, flexDirection: 'row', gap: 6, minHeight: 44, paddingHorizontal: 16 },
    buttonDisabled: { opacity: 0.6 },
    buttonPrimary: { backgroundColor: colors.accentPrimary },
    buttonPrimaryText: { color: colors.textOnAccent, fontSize: 14, fontWeight: '700' },
    buttonSecondary: { borderColor: colors.borderDefault, borderWidth: 1 },
    buttonSecondaryText: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
    chip: { backgroundColor: colors.accentSoft, borderRadius: radius.full, justifyContent: 'center', minHeight: 40, paddingHorizontal: 14 },
    chipText: { color: colors.accentPrimary, fontSize: 14, fontWeight: '700' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    error: { color: colors.accentError, fontSize: 13, fontWeight: '600', lineHeight: 19 },
    panel: { gap: 16 },
    row: { alignItems: 'center', flexDirection: 'row', gap: 12 },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      padding: 20,
      paddingBottom: 32,
    },
    title: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  });
}
