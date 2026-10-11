import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { FutureFeatureNotice } from '@/components/app/FutureFeature';
import { BackendProxyError, translateText } from '@/data/backendProxyClient';

import { FilterChip } from '@/components/training/shared';
import { styles } from '@/components/training/styles';

const translationDomains = [
  { id: 'general', label: 'Chung' },
  { id: 'medical', label: 'Y khoa' },
  { id: 'legal', label: 'Pháp lý' },
  { id: 'tech', label: 'CNTT' },
  { id: 'academic', label: 'Học thuật' },
];

export function SpecializedTranslationToolPanel() {
  const [domainId, setDomainId] = useState('general');
  const [glossaryText, setGlossaryText] = useState('MRI → cộng hưởng từ\nCT scan → chụp cắt lớp');
  const [sourceText, setSourceText] = useState('The patient underwent an MRI after the initial screening.');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [translationError, setTranslationError] = useState('');
  const [charCount, setCharCount] = useState(0);
  const isFutureFeature = true;

  const glossaryTerms = glossaryText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [source, target] = line.split(/->|→/).map((part) => part.trim());
      return { source: source ?? line, target: target ?? '' };
    });

  const highlightedTerms = glossaryTerms.filter((term) => sourceText.toLowerCase().includes(term.source.toLowerCase()));

  const handleTranslate = async () => {
    const text = sourceText.trim();
    if (!text || isTranslating) return;

    setIsTranslating(true);
    setTranslationError('');

    try {
      const res = await translateText({
        sourceText: text,
        targetLang: 'vi',
        sourceLang: 'en',
        glossaryId: domainId === 'general' ? undefined : domainId,
        formality: domainId === 'legal' || domainId === 'academic' ? 'more' : 'prefer_more',
      });
      setTranslatedText(res.translatedText);
      setCharCount(res.characterCount);
    } catch (err) {
      const msg = err instanceof BackendProxyError ? `${err.code ? `[${err.code}] ` : ''}${err.message}` : 'Lỗi kết nối đến backend dịch.';
      setTranslationError(msg);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleClear = () => {
    setTranslatedText('');
    setTranslationError('');
  };

  return (
    <View style={styles.toolPanel}>
      <View style={styles.toolPanelHeader}>
        <View style={[styles.iconWrap, { backgroundColor: '#EAF8F0' }]}>
          <Ionicons name="language-outline" size={28} color="#0F172A" />
        </View>
        <View style={styles.copy}>
          <Text style={styles.featureTitle}>Dịch chuyên ngành</Text>
          <Text style={styles.description}>UI glossary và domain đã sẵn sàng; bản deploy hiện tại chưa bật dịch production.</Text>
        </View>
      </View>
      <FutureFeatureNotice reason="Cần backend DeepL/OpenAI, auth và lưu glossary an toàn trước khi mở dịch chuyên ngành." />

      <Text style={styles.toolSectionLabel}>Chuyên ngành / chủ đề</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {translationDomains.map((domain) => (
          <FilterChip
            key={domain.id}
            isSelected={domainId === domain.id}
            label={domain.label}
            onPress={() => { setDomainId(domain.id); handleClear(); }}
          />
        ))}
      </ScrollView>

      <Text style={styles.toolSectionLabel}>Glossary (mỗi dòng: thuật ngữ → bản dịch)</Text>
      <TextInput
        multiline
        editable={!isFutureFeature}
        onChangeText={setGlossaryText}
        placeholder="Cập nhật trong phiên bản sau"
        placeholderTextColor="#94A3B8"
        style={styles.toolTextArea}
        value={glossaryText}
      />

      <Text style={styles.toolSectionLabel}>Văn bản nguồn</Text>
      <TextInput
        multiline
        editable={!isFutureFeature}
        onChangeText={setSourceText}
        placeholder="Cập nhật trong phiên bản sau"
        placeholderTextColor="#94A3B8"
        style={styles.toolTextArea}
        value={sourceText}
      />

      {highlightedTerms.length ? (
        <View style={styles.terminologyCard}>
          <Text style={styles.toolSectionLabel}>Thuật ngữ nhận diện</Text>
          <View style={styles.terminologyRow}>
            {highlightedTerms.map((term) => (
              <View key={term.source} style={styles.terminologyChip}>
                <Text style={styles.terminologyChipText}>
                  {term.source}
                  {term.target ? ` → ${term.target}` : ''}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <TouchableOpacity
        activeOpacity={0.85}
        disabled={isFutureFeature || isTranslating || !sourceText.trim()}
        onPress={handleTranslate}
        style={[styles.generateButton, (isFutureFeature || isTranslating || !sourceText.trim()) && styles.generateButtonDisabled]}>
        <Ionicons name="language-outline" size={18} color="#FFFFFF" />
        <Text style={styles.generateButtonText}>{isTranslating ? 'Đang dịch...' : 'Cập nhật sau'}</Text>
      </TouchableOpacity>

      <View style={styles.translationOutputCard}>
        <Text style={styles.toolSectionLabel}>Kết quả dịch</Text>
        {isTranslating ? (
          <Text style={styles.toolStateText}>Đang gọi API DeepL với domain {translationDomains.find((d) => d.id === domainId)?.label}...</Text>
        ) : translatedText ? (
          <>
            <Text style={styles.translationOutputText}>{translatedText}</Text>
            {charCount > 0 ? (
              <Text style={styles.toolStateText}>Ký tự đã dùng: {charCount.toLocaleString()}</Text>
            ) : null}
          </>
        ) : translationError ? (
          <View style={styles.toolStateCardError}>
            <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
            <Text style={styles.toolStateText}>{translationError}</Text>
          </View>
        ) : (
          <Text style={styles.toolStateText}>Cập nhật trong phiên bản sau. Hiện app deploy chỉ bật các luồng local-first.</Text>
        )}
      </View>
    </View>
  );
}
