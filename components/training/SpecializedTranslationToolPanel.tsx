import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Touchable from '@/components/app/Touchable';

import { FilterChip } from '@/components/training/shared';
import { styles } from '@/components/training/styles';
import { translateSpecialized, type SpecializedTranslateRequest, type SpecializedTranslateResponse } from '@/data/backendProxyClient';
import { glossaryLinesFromFile, mergeGlossaryText } from '@/data/glossaryImport';
import { findGlossaryMatches, parseGlossaryText } from '@/data/glossaryMatching';
import { parseSentenceMemoryText, selectSimilarSentencePairs } from '@/data/sentenceMemory';
import { specializedGlossaryStore } from '@/data/specializedGlossaryStore';
import { specializedSentenceStore } from '@/data/specializedSentenceStore';
import {
  MAX_TRANSLATION_AGENTS,
  TranslationAgentError,
  addTranslationAgentListener,
  deleteTranslationAgent,
  loadTranslationAgents,
  saveTranslationAgent,
  type TranslationAgentPair,
  type TranslationAgentPreset,
  type TranslationTone,
} from '@/data/translationAgentPresets';
import { useDomainText } from '@/hooks/use-domain-text';
import { useToken } from '@/hooks/use-token';

const translationDomains: { id: SpecializedTranslateRequest['domainId']; label: string }[] = [
  { id: 'general', label: 'Chung' },
  { id: 'medical', label: 'Y khoa' },
  { id: 'legal', label: 'Pháp lý' },
  { id: 'tech', label: 'CNTT' },
  { id: 'academic', label: 'Học thuật' },
];

const languagePairs: { id: TranslationAgentPair; label: string; sourceLang: string; targetLang: string }[] = [
  { id: 'en-vi', label: 'Anh → Việt', sourceLang: 'en', targetLang: 'vi' },
  { id: 'vi-en', label: 'Việt → Anh', sourceLang: 'vi', targetLang: 'en' },
];

const translationTones: { id: TranslationTone; label: string }[] = [
  { id: 'neutral', label: 'Trung lập' },
  { id: 'formal', label: 'Trang trọng' },
  { id: 'plain', label: 'Dễ hiểu' },
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
  if (code === 'sentence_example_invalid') return 'Câu mẫu quá dài (tối đa 500 ký tự mỗi câu).';
  return 'Máy chủ dịch tạm thời không phản hồi. Thử lại sau.';
}

export function SpecializedTranslationToolPanel() {
  const { colors } = useToken();
  const [domainId, setDomainId] = useState<SpecializedTranslateRequest['domainId']>('general');
  const [pairId, setPairId] = useState<TranslationAgentPair>(languagePairs[0].id);
  const [tone, setTone] = useState<TranslationTone>('neutral');
  const [agents, setAgents] = useState<TranslationAgentPreset[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [agentName, setAgentName] = useState('');
  const [agentMessage, setAgentMessage] = useState('');
  const [glossaries, setGlossaryText] = useDomainText(specializedGlossaryStore);
  const [sentenceMemories, setSentenceText] = useDomainText(specializedSentenceStore);
  const [sourceText, setSourceText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [result, setResult] = useState<SpecializedTranslateResponse | null>(null);
  const [translationError, setTranslationError] = useState('');

  useEffect(() => {
    const reload = () => {
      loadTranslationAgents().then((next) => {
        setAgents(next);
        setSelectedAgentId((current) => (current && next.some((agent) => agent.id === current) ? current : null));
      }).catch(() => undefined);
    };
    reload();
    return addTranslationAgentListener(reload);
  }, []);

  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId) ?? null;

  const applyAgent = (agent: TranslationAgentPreset) => {
    setSelectedAgentId(agent.id);
    setAgentName(agent.name);
    setPairId(agent.pairId);
    setDomainId(agent.domainId);
    setTone(agent.tone);
    setAgentMessage('');
    resetResult();
  };

  const handleSaveAgent = async () => {
    try {
      const saved = await saveTranslationAgent({ domainId, id: selectedAgent?.id, name: agentName, pairId, tone });
      setSelectedAgentId(saved.id);
      setAgentMessage(selectedAgent ? `Đã cập nhật agent “${saved.name}”.` : `Đã lưu agent “${saved.name}”.`);
    } catch (error) {
      const code = error instanceof TranslationAgentError ? error.code : '';
      setAgentMessage(
        code === 'agent_limit_reached' ? `Tối đa ${MAX_TRANSLATION_AGENTS} agent. Xoá một agent để tạo agent mới.`
          : code === 'agent_name_invalid' ? 'Đặt tên agent (tối đa 40 ký tự).'
            : 'Không lưu được agent. Thử lại.'
      );
    }
  };

  const handleDeleteAgent = async () => {
    if (!selectedAgent) return;
    await deleteTranslationAgent(selectedAgent.id).catch(() => undefined);
    setSelectedAgentId(null);
    setAgentName('');
    setAgentMessage(`Đã xoá agent “${selectedAgent.name}”.`);
  };

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
  const sentenceText = sentenceMemories[domainId] ?? '';
  const sentenceMemory = useMemo(() => parseSentenceMemoryText(sentenceText), [sentenceText]);
  // Pairs are written in the pair's direction; when translating the other way they are swapped.
  const directedPairs = useMemo(
    () => (pair.sourceLang === 'en' ? sentenceMemory.pairs : sentenceMemory.pairs.map((item) => ({ source: item.target, target: item.source }))),
    [pair.sourceLang, sentenceMemory.pairs]
  );
  const similarPairs = useMemo(() => selectSimilarSentencePairs(sourceText, directedPairs), [directedPairs, sourceText]);
  const sourceLength = Array.from(sourceText.trim()).length;
  const canTranslate = sourceLength > 0 && sourceLength <= MAX_SOURCE_CHARS && terms.length <= MAX_GLOSSARY_TERMS && !isTranslating;

  const handleGlossaryChange = (value: string) => setGlossaryText(domainId, value);

  const handleImport = async (kind: 'glossary' | 'sentences') => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: [
          'text/csv',
          'text/tab-separated-values',
          'text/plain',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/pdf',
        ],
      });
      if (picked.canceled || !picked.assets?.length) return;
      const asset = picked.assets[0];
      const { lines, skippedRows } = await glossaryLinesFromFile(asset.file ?? new File(asset.uri), asset.name, asset.mimeType ?? '');
      const isGlossary = kind === 'glossary';
      const merged = mergeGlossaryText(isGlossary ? glossaryText : sentenceText, lines);
      if (isGlossary) setGlossaryText(domainId, merged.text);
      else setSentenceText(domainId, merged.text);
      const domainLabel = translationDomains.find((domain) => domain.id === domainId)?.label ?? '';
      const noun = isGlossary ? 'thuật ngữ' : 'câu mẫu';
      Alert.alert(
        isGlossary ? 'Đã nhập glossary' : 'Đã nhập câu mẫu',
        `Thêm ${merged.addedCount} ${noun} vào ${isGlossary ? 'glossary' : 'bộ câu mẫu'} ${domainLabel}.`
          + (lines.length > merged.addedCount ? ` ${lines.length - merged.addedCount} ${noun} đã có được giữ nguyên.` : '')
          + (skippedRows ? ` Bỏ qua ${skippedRows} dòng thiếu cột.` : '')
      );
    } catch {
      Alert.alert(
        kind === 'glossary' ? 'Không thể nhập glossary' : 'Không thể nhập câu mẫu',
        'Chọn file CSV/TSV, DOCX (bảng 2 cột) hoặc PDF có dòng “câu nguồn -> bản dịch”.'
      );
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
        examples: similarPairs,
        glossary: terms,
        sourceLang: pair.sourceLang,
        sourceText: sourceText.trim(),
        targetLang: pair.targetLang,
        tone,
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
            Dịch bằng AI theo chuyên ngành, glossary và câu mẫu của bạn. Dữ liệu lưu trên thiết bị và đồng bộ theo tài khoản khi bật Cloud Sync; khi dịch chỉ gửi kèm thuật ngữ có trong đoạn văn và tối đa 5 câu mẫu giống nhất. Cần đăng nhập cloud.
          </Text>
        </View>
      </View>

      <Text style={styles.toolSectionLabel}>Agent dịch ({agents.length}/{MAX_TRANSLATION_AGENTS})</Text>
      {agents.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {agents.map((agent) => (
            <FilterChip key={agent.id} isSelected={selectedAgentId === agent.id} label={agent.name} onPress={() => applyAgent(agent)} />
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.toolStateText}>Lưu chiều dịch, chuyên ngành và văn phong thành agent để dùng lại (tối đa {MAX_TRANSLATION_AGENTS}).</Text>
      )}
      <TextInput
        accessibilityLabel="Tên agent"
        maxLength={40}
        onChangeText={(value) => { setAgentName(value); setAgentMessage(''); }}
        placeholder="Tên agent, ví dụ: Hồ sơ bệnh án"
        placeholderTextColor={colors.textTertiary}
        style={[styles.toolTextArea, localStyles.agentNameInput]}
        value={agentName}
      />
      <View style={localStyles.agentRow}>
        <Touchable
          accessibilityRole="button"
          activeOpacity={0.85}
          onPress={handleSaveAgent}
          style={[localStyles.importButton, localStyles.agentButton, { borderColor: colors.accentPrimary }]}>
          <Text style={[localStyles.importButtonText, { color: colors.accentPrimary }]}>{selectedAgent ? 'Lưu thay đổi' : 'Lưu thành agent'}</Text>
        </Touchable>
        {selectedAgent ? (
          <Touchable
            accessibilityLabel={`Xoá agent ${selectedAgent.name}`}
            accessibilityRole="button"
            activeOpacity={0.85}
            onPress={handleDeleteAgent}
            style={[localStyles.importButton, localStyles.agentButton, { borderColor: colors.accentError }]}>
            <Text style={[localStyles.importButtonText, { color: colors.accentError }]}>Xoá</Text>
          </Touchable>
        ) : null}
      </View>
      {agentMessage ? <Text accessibilityLiveRegion="polite" style={styles.toolStateText}>{agentMessage}</Text> : null}

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

      <Text style={styles.toolSectionLabel}>Văn phong</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {translationTones.map((item) => (
          <FilterChip key={item.id} isSelected={tone === item.id} label={item.label} onPress={() => { setTone(item.id); resetResult(); }} />
        ))}
      </ScrollView>

      <Text style={styles.toolSectionLabel}>
        Glossary {translationDomains.find((domain) => domain.id === domainId)?.label} ({terms.length} thuật ngữ)
      </Text>
      <Touchable
        accessibilityRole="button"
        activeOpacity={0.85}
        onPress={() => handleImport('glossary')}
        style={[localStyles.importButton, { borderColor: colors.accentPrimary }]}>
        <Ionicons name="document-attach-outline" size={16} color={colors.accentPrimary} />
        <Text style={[localStyles.importButtonText, { color: colors.accentPrimary }]}>Nhập CSV/TSV/DOCX/PDF</Text>
      </Touchable>
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

      <Text style={styles.toolSectionLabel}>
        Câu mẫu {translationDomains.find((domain) => domain.id === domainId)?.label} ({sentenceMemory.pairs.length} câu)
      </Text>
      <Text style={styles.toolStateText}>Các cặp câu đã dịch chuẩn (tiếng Anh → tiếng Việt). Câu giống đoạn văn nhất được gửi kèm để AI dịch theo cách dùng từ và văn phong của bạn.</Text>
      <Touchable
        accessibilityRole="button"
        activeOpacity={0.85}
        onPress={() => handleImport('sentences')}
        style={[localStyles.importButton, { borderColor: colors.accentPrimary }]}>
        <Ionicons name="document-attach-outline" size={16} color={colors.accentPrimary} />
        <Text style={[localStyles.importButtonText, { color: colors.accentPrimary }]}>Nhập câu mẫu từ file</Text>
      </Touchable>
      <TextInput
        accessibilityLabel="Câu mẫu"
        multiline
        onChangeText={(value) => setSentenceText(domainId, value)}
        placeholder={'Mỗi dòng một cặp câu, ví dụ:\nThe patient was discharged. → Bệnh nhân đã được xuất viện.'}
        placeholderTextColor={colors.textTertiary}
        style={styles.toolTextArea}
        value={sentenceText}
      />
      {sentenceMemory.invalidLines.length ? (
        <View accessibilityRole="alert" style={styles.toolStateCardError}>
          <Ionicons name="warning-outline" size={16} color={colors.accentWarning} />
          <Text style={styles.toolStateText}>
            Bỏ qua dòng {sentenceMemory.invalidLines.slice(0, 5).join(', ')}{sentenceMemory.invalidLines.length > 5 ? '…' : ''}: cần dạng “câu nguồn → bản dịch”.
          </Text>
        </View>
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

      {similarPairs.length ? (
        <View style={styles.terminologyCard}>
          <Text style={styles.toolSectionLabel}>Câu mẫu tương tự ({similarPairs.length})</Text>
          {similarPairs.map((item) => (
            <Text key={item.source} numberOfLines={2} style={styles.toolStateText}>{item.source} → {item.target}</Text>
          ))}
        </View>
      ) : null}

      <Touchable
        accessibilityRole="button"
        accessibilityState={{ busy: isTranslating, disabled: !canTranslate }}
        activeOpacity={0.85}
        disabled={!canTranslate}
        onPress={handleTranslate}
        style={[styles.generateButton, !canTranslate && styles.generateButtonDisabled]}>
        <Ionicons name="language-outline" size={18} color={colors.textOnAccent} />
        <Text style={styles.generateButtonText}>{isTranslating ? 'Đang dịch...' : 'Dịch theo glossary'}</Text>
      </Touchable>

      <View style={styles.translationOutputCard}>
        <Text style={styles.toolSectionLabel}>Kết quả dịch</Text>
        {isTranslating ? (
          <Text style={styles.toolStateText}>Đang dịch với chuyên ngành {translationDomains.find((d) => d.id === domainId)?.label}...</Text>
        ) : result ? (
          <>
            <Text selectable style={styles.translationOutputText}>{result.translatedText}</Text>
            <Text style={styles.toolStateText}>
              Đã áp dụng {result.appliedTerms.length} thuật ngữ{result.examplesUsed ? ` và ${result.examplesUsed} câu mẫu` : ''} · {result.characterCount.toLocaleString('vi-VN')} ký tự · Bản dịch AI, hãy kiểm tra lại trước khi dùng chính thức.
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
  agentButton: {
    marginBottom: 0,
  },
  agentNameInput: {
    minHeight: 40,
    paddingVertical: 8,
  },
  agentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
    marginTop: 8,
  },
  importButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
