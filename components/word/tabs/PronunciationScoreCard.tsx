import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/app/AppButton';
import { assessPronunciation, type PronunciationResult } from '@/data/backendProxyClient';
import { describePronunciationError } from '@/data/pronunciationErrors';
import { useToken } from '@/hooks/use-token';

type Props = { audioUri: string; language: string; referenceText: string };

// Pronunciation scoring (plan 4.6). Every attempt is an explicit tap that says where the audio goes
// (owner decision D6: sent to Microsoft Azure through the app's server and not stored).
export function PronunciationScoreCard({ audioUri, language, referenceText }: Props) {
  const { colors, radius, spacing } = useToken();
  const [status, setStatus] = useState<'idle' | 'scoring' | 'ready' | 'error'>('idle');
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const [error, setError] = useState('');

  const scoreColor = (value: number) => (value >= 80 ? colors.accentSuccess : value >= 60 ? colors.accentWarning : colors.accentError);

  const handleScore = async () => {
    setStatus('scoring');
    setError('');
    try {
      setResult(await assessPronunciation({ audioUri, language, referenceText }));
      setStatus('ready');
    } catch (scoreError) {
      setError(describePronunciationError(scoreError));
      setStatus('error');
    }
  };

  return (
    <View style={[styles.card, { borderColor: colors.borderDefault, borderRadius: radius.md, gap: spacing.md, padding: spacing.lg }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Chấm điểm phát âm</Text>
      <Text style={[styles.text, { color: colors.textSecondary }]}>
        Bản ghi được gửi qua máy chủ của ứng dụng tới Microsoft Azure để chấm điểm, rồi bị xóa ngay. Không lưu âm thanh. Tối đa 20 lượt mỗi ngày.
      </Text>
      <AppButton
        disabled={status === 'scoring'}
        icon="analytics-outline"
        label={status === 'ready' ? 'Chấm lại bản ghi này' : 'Gửi bản ghi để chấm điểm'}
        onPress={handleScore}
        variant="primary"
      />
      {status === 'scoring' ? <ActivityIndicator accessibilityLabel="Đang chấm điểm" color={colors.accentPrimary} /> : null}
      {status === 'error' ? <Text accessibilityRole="alert" style={[styles.text, { color: colors.accentError }]}>{error}</Text> : null}
      {status === 'ready' && result ? (
        <View style={{ gap: spacing.md }}>
          <View accessibilityLabel={`Điểm tổng ${result.overallScore} trên 100`} style={[styles.row, { gap: spacing.md }]}>
            <Text style={[styles.overall, { color: scoreColor(result.overallScore) }]}>{result.overallScore}</Text>
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Text style={[styles.text, { color: colors.textPrimary }]}>Chính xác {result.accuracyScore} · Trôi chảy {result.fluencyScore} · Đầy đủ {result.completenessScore}</Text>
              {result.recognizedText ? <Text style={[styles.text, { color: colors.textSecondary }]}>Nghe được: “{result.recognizedText}”</Text> : null}
            </View>
          </View>
          {result.words.length ? (
            <View style={[styles.wrap, { gap: spacing.sm }]}>
              {result.words.map((word, index) => (
                <View key={`${word.text}-${index}`} style={[styles.chip, { borderColor: scoreColor(word.accuracy), borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }]}>
                  <Text style={[styles.text, { color: colors.textPrimary }]}>{word.text} {word.accuracy}{word.error ? ` · ${word.error}` : ''}</Text>
                </View>
              ))}
            </View>
          ) : null}
          {result.phonemes.length ? (
            <View style={[styles.wrap, { gap: spacing.sm }]}>
              {result.phonemes.map((phoneme, index) => (
                <View key={`${phoneme.phoneme}-${index}`} style={[styles.chip, { borderColor: scoreColor(phoneme.score), borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }]}>
                  <Text style={[styles.text, { color: colors.textPrimary }]}>/{phoneme.phoneme}/ {phoneme.score}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.text, { color: colors.textTertiary }]}>Azure chưa trả điểm theo âm vị cho ngôn ngữ này.</Text>
          )}
          <Text style={[styles.caption, { color: colors.textTertiary }]}>Điểm do Microsoft Azure AI Speech chấm.</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  caption: { fontSize: 12 },
  card: { borderWidth: 1, marginTop: 12 },
  chip: { borderWidth: 1 },
  overall: { fontSize: 36, fontWeight: '800' },
  row: { alignItems: 'center', flexDirection: 'row' },
  text: { fontSize: 14, lineHeight: 20 },
  title: { fontSize: 16, fontWeight: '700' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
});
