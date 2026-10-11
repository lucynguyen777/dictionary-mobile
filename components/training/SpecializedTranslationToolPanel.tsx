import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { FilterChip } from '@/components/training/shared';
import { styles } from '@/components/training/styles';
import { translateSpecialized, type SpecializedTranslateRequest, type SpecializedTranslateResponse } from '@/data/backendProxyClient';
import { glossaryLinesFromDelimitedText, mergeGlossaryText } from '@/data/glossaryImport';
import { findGlossaryMatches, parseGlossaryText } from '@/data/glossaryMatching';
import {
  addSpecializedGlossaryListener,
  loadSpecializedGlossaries,
  saveSpecializedGlossary,
  type SpecializedGlossaries,
} from '@/data/specializedGlossaryStore';
import { useToken } from '@/hooks/use-token';

const translationDomains: { id: SpecializedTranslateRequest['domainId']; label: string }[] = [
  { id: 'general', label: 'Chung' },
  { id: 'medical', label: 'Y khoa' },
  { id: 'legal', label: 'Pháp lý' },
  { id: 'tech', label: 'CNTT' },
  { id: 'academic', label: 'Học thuật' },
];

const languagePairs = [
  { id: 'en-vi', label: 'Anh → Việt', sourceLang: 'en', targetLang: 'vi' },
  { id: 'vi-en', label: 'Việt → Anh', sourceLang: 'vi', targetLang: 'en' },
];

const MAX_SOURCE_CHARS = 5_000;
const MAX_GLOSSARY_TERMS = 1_000;

export function describeSpecializedTranslationError(error: unknown) {
  const { code, status } = (error ?? {}) as { code?: string; status?: number };
  if (code === 'backend_proxy_unconfigured' || code === 'provider_unconfigured') return 'Máy chủ dịch chưa được bật trên bản cài đặt này.';
  if (status === 401) return 'Đăng nhập cloud để dùng dịch chuyên ngành.';
  if (status === 429) return 'Bạn đã dùng hết hạn mức ký tự dịch hôm nay. Thử lại vào ngày mai.';
  if (code === 'text_too_large') return `Văn bản tối đa ${MAX_SOURCE_CHARS.toLocaleString('vi-VN')} ký tự mỗi lần dịch.`;
  if (code === 'glossary_entry_invalid' || code === 'glossary_entry_duplicate') return 'Glossary có dòng không hợp lệ (mỗi thuật ngữ tối đa 120 ký tự, không trùng).';
  return 'Máy chủ dịch tạm thời không phản hồi. Thử lại sau.';
}

export function SpecializedTranslationToolPanel() {
  const { colors } = useToken();
  const [domainId, setDomainId] = useState<SpecializedTranslateRequest['domainId']>('general');
  const [pairId, setPairId] = useState(languagePairs[0].id);
  const [glossaries, setGlossaries] = useState<SpecializedGlossaries>({});
  const [sourceText, setSourceText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [result, setResult] = useState<SpecializedTranslateResponse | null>(null);
  const [translationError, setTranslationError] = useState('');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSave = useRef<{ domainId: string; text: string } | null>(null);

  useEffect(() => {
    const reload = () => {
      // A pending local edit is newer than anything stored; reloading now would revert it.
      if (pendingSave.current) return;
      loadSpecializedGlossaries().then(setGlossaries).catch(() => undefined);
    };
    reload();
    const unsubscribe = addSpecializedGlossaryListener(reload);
    return () => {
      unsubscribe();
      if (saveTimer.current) clearTimeout(saveTimer.current);
      // Leaving the panel right after typing must not drop the last edit.
      const pending = pendingSave.current;
      pendingSave.current = null;
      if (pending) saveSpecializedGlossary(pending.domainId, pending.text).catch(() => undefined);
    };
  }, []);

  const glossaryText = glossaries[domainId] ?? '';
  const pair = languagePairs.find((item) => item.id === pairId) ?? languagePairs[0];
  const { invalidLines, terms } = useMemo(() => parseGlossaryText(glossaryText), [glossaryText]);
  const matchedTerms = useMemo(() => {
    const seen = new Set<string>();
    return findGlossaryMatches(sourceText, terms).filter((match) => {
      const key = match.sourceTerm.toLocaleLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [sourceText, terms]);
  const sourceLength = Array.from(sourceText.trim()).length;
  const canTranslate = sourceLength > 0 && sourceLength <= MAX_SOURCE_CHARS && terms.length <= MAX_GLOSSARY_TERMS && !isTranslating;

  const handleGlossaryChange = (value: string) => {
    setGlossaries((current) => ({ ...current, [domainId]: value }));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    pendingSave.current = { domainId, text: value };
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      const pending = pendingSave.current;
      pendingSave.current = null;
      if (pending) saveSpecializedGlossary(pending.domainId, pending.text).catch(() => undefined);
    }, 400);
  };

  const handleImportGlossary = async () => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: ['text/csv', 'text/tab-separated-values', 'text/plain', 'application/vnd.ms-excel'],
      });
      if (picked.canceled || !picked.assets?.length) return;
      const asset = picked.assets[0];
      const fileText = await (asset.file ?? new File(asset.uri)).text();
      const { lines, skippedRows } = glossaryLinesFromDelimitedText(fileText);
      const merged = mergeGlossaryText(glossaryText, lines);
      handleGlossaryChange(merged.text);
      const domainLabel = translationDomains.find((domain) => domain.id === domainId)?.label ?? '';
      Alert.alert(
        'Đã nhập glossary',
        `Thêm ${merged.addedCount} thuật ngữ vào glossary ${domainLabel}.`
          + (lines.length > merged.addedCount ? ` ${lines.length - merged.addedCount} thuật ngữ đã có được giữ nguyên.` : '')
          + (skippedRows ? ` Bỏ qua ${skippedRows} dòng thiếu cột.` : '')
      );
    } catch {
      Alert.alert('Không thể nhập glossary', 'Chọn file CSV hoặc TSV có 2 cột: thuật ngữ, bản dịch.');
    }
  };

  const resetResult = () => {
    setResult(null);
    setTranslationError('');
  };

  const handleTranslate = async () => {
    if (!canTranslate) return;
    setIsTranslating(true);
    resetResult();
    try {
      setResult(await translateSpecialized({
        domainId,
        glossary: terms,
        sourceLang: pair.sourceLang,
        sourceText: sourceText.trim(),
        targetLang: pair.targetLang,
      }));
    } catch (error) {
      setTranslationError(describeSpecializedTranslationError(error));
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <View style={styles.toolPanel}>
      <View style={styles.toolPanelHeader}>
        <View style={[styles.iconWrap, { backgroundColor: colors.statusSuccess }]}>
          <Ionicons name="language-outline" size={28} color={colors.accentSuccess} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.featureTitle}>Dịch chuyên ngành</Text>
          <Text style={styles.description}>
            Dịch bằng AI theo chuyên ngành và glossary của bạn. Glossary lưu trên thiết bị và đồng bộ theo tài khoản khi bật Cloud Sync; khi dịch chỉ gửi kèm thuật ngữ có trong đoạn văn. Cần đăng nhập cloud.
          </Text>
        </View>
      </View>

      <Text style={styles.toolSectionLabel}>Chiều dịch</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {languagePairs.map((item) => (
          <FilterChip key={item.id} isSelected={pairId === item.id} label={item.label} onPress={() => { setPairId(item.id); resetResult(); }} />
        ))}
      </ScrollView>

      <Text style={styles.toolSectionLabel}>Chuyên ngành / chủ đề</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {translationDomains.map((domain) => (
          <FilterChip
            key={domain.id}
            isSelected={domainId === domain.id}
            label={domain.label}
            onPress={() => { setDomainId(domain.id); resetResult(); }}
          />
        ))}
      </ScrollView>

      <Text style={styles.toolSectionLabel}>
        Glossary {translationDomains.find((domain) => domain.id === domainId)?.label} ({terms.length} thuật ngữ)
      </Text>
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.85}
        onPress={handleImportGlossary}
        style={[localStyles.importButton, { borderColor: colors.accentPrimary }]}>
        <Ionicons name="document-attach-outline" size={16} color={colors.accentPrimary} />
        <Text style={[localStyles.importButtonText, { color: colors.accentPrimary }]}>Nhập CSV/TSV (2 cột)</Text>
      </TouchableOpacity>
      <TextInput
        accessibilityLabel="Glossary"
        autoCapitalize="none"
        multiline
        onChangeText={handleGlossaryChange}
        placeholder={'Mỗi dòng một thuật ngữ, ví dụ:\nMRI → cộng hưởng từ\nCT scan -> chụp cắt lớp vi tính'}
        placeholderTextColor={colors.textTertiary}
        style={styles.toolTextArea}
        value={glossaryText}
      />
      {invalidLines.length ? (
        <View accessibilityRole="alert" style={styles.toolStateCardError}>
          <Ionicons name="warning-outline" size={16} color={colors.accentWarning} />
          <Text style={styles.toolStateText}>
            Bỏ qua dòng {invalidLines.slice(0, 5).join(', ')}{invalidLines.length > 5 ? '…' : ''}: cần dạng “thuật ngữ → bản dịch”.
          </Text>
        </View>
      ) : null}
      {terms.length > MAX_GLOSSARY_TERMS ? (
        <Text accessibilityRole="alert" style={[styles.toolStateText, { color: colors.accentError }]}>
          Glossary tối đa {MAX_GLOSSARY_TERMS.toLocaleString('vi-VN')} thuật ngữ mỗi chuyên ngành.
        </Text>
      ) : null}

      <Text style={styles.toolSectionLabel}>Văn bản nguồn</Text>
      <TextInput
        accessibilityLabel="Văn bản nguồn"
        multiline
        onChangeText={(value) => { setSourceText(value); setTranslationError(''); }}
        placeholder={pair.sourceLang === 'en' ? 'Dán đoạn văn tiếng Anh cần dịch...' : 'Dán đoạn văn tiếng Việt cần dịch...'}
        placeholderTextColor={colors.textTertiary}
        style={styles.toolTextArea}
        value={sourceText}
      />
      <Text style={[styles.toolStateText, sourceLength > MAX_SOURCE_CHARS && { color: colors.accentError }]}>
        {sourceLength.toLocaleString('vi-VN')}/{MAX_SOURCE_CHARS.toLocaleString('vi-VN')} ký tự
      </Text>

      {matchedTerms.length ? (
        <View style={styles.terminologyCard}>
          <Text style={styles.toolSectionLabel}>Thuật ngữ nhận diện</Text>
          <View style={styles.terminologyRow}>
            {matchedTerms.map((term) => (
              <View key={term.sourceTerm} style={styles.terminologyChip}>
                <Text style={styles.terminologyChipText}>{term.sourceTerm} → {term.targetTerm}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ busy: isTranslating, disabled: !canTranslate }}
        activeOpacity={0.85}
        disabled={!canTranslate}
        onPress={handleTranslate}
        style={[styles.generateButton, !canTranslate && styles.generateButtonDisabled]}>
        <Ionicons name="language-outline" size={18} color={colors.textOnAccent} />
        <Text style={styles.generateButtonText}>{isTranslating ? 'Đang dịch...' : 'Dịch theo glossary'}</Text>
      </TouchableOpacity>

      <View style={styles.translationOutputCard}>
        <Text style={styles.toolSectionLabel}>Kết quả dịch</Text>
        {isTranslating ? (
          <Text style={styles.toolStateText}>Đang dịch với chuyên ngành {translationDomains.find((d) => d.id === domainId)?.label}...</Text>
        ) : result ? (
          <>
            <Text selectable style={styles.translationOutputText}>{result.translatedText}</Text>
            <Text style={styles.toolStateText}>
              Đã áp dụng {result.appliedTerms.length} thuật ngữ · {result.characterCount.toLocaleString('vi-VN')} ký tự · Bản dịch AI, hãy kiểm tra lại trước khi dùng chính thức.
            </Text>
          </>
        ) : translationError ? (
          <View accessibilityRole="alert" style={styles.toolStateCardError}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.accentError} />
            <Text style={styles.toolStateText}>{translationError}</Text>
          </View>
        ) : (
          <Text style={styles.toolStateText}>Bản dịch sẽ hiển thị ở đây.</Text>
        )}
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  importButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
    minHeight: 40,
    paddingHorizontal: 12,
  },
  importButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
