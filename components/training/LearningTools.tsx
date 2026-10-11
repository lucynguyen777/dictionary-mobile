import Ionicons from '@expo/vector-icons/Ionicons';
import { ComponentProps } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { FutureFeatureBadge } from '@/components/app/FutureFeature';
import { useToken } from '@/hooks/use-token';

import { type LearningToolId } from '@/components/training/shared';
import { styles } from '@/components/training/styles';

export const learningTools: {
  id: LearningToolId;
  title: string;
  description: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  accent: string;
  status: string;
  future?: boolean;
  futureReason?: string;
}[] = [
  {
    id: 'flashcards',
    title: 'Flashcard local',
    description: 'Tạo, lọc và ôn thẻ từ các từ đã lưu.',
    icon: 'albums-outline',
    accent: '#FFEFF3',
    status: 'Đang dùng được',
  },
  {
    id: 'ai-chat',
    title: 'AI Tutor',
    description: 'Luyện hội thoại, sửa câu, giải thích ngữ pháp và nhập vai với AI.',
    icon: 'chatbubbles-outline',
    accent: '#F3E8FF',
    status: 'Cần đăng nhập cloud',
  },
  {
    id: 'specialized-translation',
    title: 'Dịch chuyên ngành',
    description: 'Dịch đoạn văn theo thuật ngữ cá nhân và ngữ cảnh học thuật.',
    icon: 'language-outline',
    accent: '#EAF8F0',
    status: 'Cần đăng nhập cloud',
  },
  {
    id: 'import',
    title: 'Nhập dữ liệu',
    description: 'Nhập CSV, highlight từ sách hoặc danh sách từ từ lớp học.',
    icon: 'cloud-upload-outline',
    accent: '#FFF1E8',
    status: 'CSV/TSV đã có',
  },
  {
    id: 'reader',
    title: 'Đọc sách kèm tra từ',
    description: 'Highlight, tra nghĩa, lưu ghi chú và tạo flashcard ngay khi đọc.',
    icon: 'reader-outline',
    accent: '#F1ECFF',
    status: 'TXT/HTML đã có',
  },
  {
    id: 'export',
    title: 'Xuất bộ từ',
    description: 'Xuất sang CSV, Excel hoặc Anki text để học ngoài app.',
    icon: 'download-outline',
    accent: '#EAF7FA',
    status: 'CSV/Excel/Anki text',
  },
];

export function ToolTab({
  onPress,
  tool,
}: {
  onPress: () => void;
  tool: (typeof learningTools)[number];
}) {
  const { colors, shadows } = useToken();

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={[
        styles.toolTab,
        { backgroundColor: colors.surface, borderColor: colors.borderDefault, ...shadows.sm },
        tool.future && styles.futureFeatureMuted,
      ]}>
      <View style={[styles.toolTabIcon, { backgroundColor: tool.accent }]}>
        <Ionicons name={tool.icon} size={18} color="#0F172A" />
      </View>
      <View style={styles.toolTabCopy}>
        <View style={styles.futureTitleRow}>
          <Text style={[styles.toolTabText, { color: colors.textPrimary }]} numberOfLines={1}>{tool.title}</Text>
          {tool.future ? <FutureFeatureBadge /> : null}
        </View>
        <Text style={[styles.toolTabDescription, { color: colors.textSecondary }]} numberOfLines={2}>{tool.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

export function LearningToolPanel({ tool }: { tool: (typeof learningTools)[number] }) {
  const { colors, shadows } = useToken();

  return (
    <View style={[styles.toolPanel, { backgroundColor: colors.surface, borderColor: colors.borderDefault, ...shadows.sm }]}>
      <View style={styles.toolPanelHeader}>
        <View style={[styles.iconWrap, { backgroundColor: tool.accent }]}>
          <Ionicons name={tool.icon} size={28} color="#0F172A" />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>{tool.title}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>{tool.description}</Text>
        </View>
      </View>
      <View style={styles.toolStatusPill}>
        <Text style={styles.toolStatusText}>{tool.status}</Text>
      </View>
      <View style={styles.toolRoadmap}>
        <Text style={styles.toolRoadmapTitle}>Frontend/UI roadmap</Text>
        <Text style={styles.toolRoadmapText}>
          {getToolRoadmapText(tool.id)}
        </Text>
      </View>
    </View>
  );
}

function getToolRoadmapText(toolId: LearningToolId) {
  if (toolId === 'specialized-translation') {
    return 'Glossary lưu trên thiết bị theo chuyên ngành và được áp dụng khi dịch qua máy chủ AI. Bước tiếp theo: import glossary từ CSV/TSV và đồng bộ glossary theo tài khoản.';
  }
  if (toolId === 'import') {
    return 'Polish flow import dataset: preview, mapping cột/hàng, chọn folder đích, validate trùng/trống và tạo flashcard từ dataset.';
  }
  if (toolId === 'reader') {
    return 'Reader đã có TXT/HTML, highlight, save/note/flashcard. Bước tiếp theo là chọn parser cho EPUB/PDF/DOCX và UI xử lý lỗi định dạng.';
  }

  return 'Chuẩn hóa xuất CSV/Excel/Anki text; Google Sheets vẫn cần OAuth, còn Anki .apkg cần parser/package riêng.';
}
