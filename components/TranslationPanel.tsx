import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { translateText, type TranslateTextResponse } from '@/data/backendProxyClient';
import { useToken } from '@/hooks/use-token';

interface TranslationPanelProps {
  sourceText: string;
  targetLang?: string; // Default: 'VI'
  sourceLang?: string;
}

export function TranslationPanel({
  sourceText,
  targetLang = 'VI',
  sourceLang,
}: TranslationPanelProps) {
  const { colors, spacing, radius, typography } = useToken();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TranslateTextResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTranslate = async () => {
    if (!sourceText || sourceText.trim().length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const response = await translateText({
        sourceText: sourceText.trim(),
        targetLang,
        sourceLang,
      });
      setResult(response);
    } catch (err: any) {
      if (err?.status === 429) {
        setError('Bạn đã vượt quá định mức dịch thuật của tài khoản.');
      } else if (err?.status === 503) {
        setError('Dịch vụ dịch thuật hiện chưa được cấu hình.');
      } else {
        setError(err?.message || 'Có lỗi xảy ra khi thực hiện dịch thuật.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getLanguageLabel = (code: string) => {
    switch (code.toUpperCase()) {
      case 'VI': return 'Tiếng Việt';
      case 'EN': return 'Tiếng Anh';
      default: return code.toUpperCase();
    }
  };

  return (
    <View style={[styles.container, { borderColor: colors.borderDefault }]}>
      {!result && !loading && !error && (
        <TouchableOpacity
          style={[styles.translateButton, { backgroundColor: colors.accentPrimary, borderRadius: radius.md }]}
          onPress={handleTranslate}
        >
          <Ionicons name="language-outline" size={16} color={colors.textInverse} style={styles.icon} />
          <Text style={[styles.buttonText, { color: colors.textInverse, ...typography.bodySmBold }]}>
            Dịch sang {getLanguageLabel(targetLang)}
          </Text>
        </TouchableOpacity>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.accentPrimary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary, ...typography.caption }]}>
            Đang biên dịch bằng DeepL...
          </Text>
        </View>
      )}

      {error && (
        <View style={[styles.errorContainer, { backgroundColor: colors.statusError, borderRadius: radius.md }]}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.accentError} style={styles.icon} />
          <Text style={[styles.errorText, { color: colors.accentError, ...typography.bodySm }]}>
            {error}
          </Text>
          <TouchableOpacity onPress={handleTranslate} style={styles.retryButton}>
            <Text style={{ color: colors.accentPrimary, ...typography.bodySmBold }}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      )}

      {result && (
        <View style={[styles.resultContainer, { backgroundColor: colors.canvasAlt, borderRadius: radius.md }]}>
          <View style={styles.header}>
            <Text style={[styles.providerText, { color: colors.textTertiary, ...typography.captionSmall }]}>
              Dịch bởi DeepL • Nhận diện: {getLanguageLabel(result.detectedSourceLanguage)}
            </Text>
            <TouchableOpacity onPress={() => setResult(null)} style={styles.closeButton}>
              <Ionicons name="close-outline" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.translatedText, { color: colors.textPrimary, ...typography.bodySm }]}>
            {result.translatedText}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
    paddingTop: 12,
  },
  translateButton: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  icon: {
    marginRight: 6,
  },
  buttonText: {
    fontSize: 13,
  },
  loadingContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  loadingText: {
    marginLeft: 8,
  },
  errorContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
  },
  retryButton: {
    marginLeft: 8,
  },
  resultContainer: {
    padding: 10,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  providerText: {
    fontSize: 11,
  },
  closeButton: {
    padding: 2,
  },
  translatedText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
