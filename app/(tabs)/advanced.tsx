import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Screen from '@/components/app/Screen';

const features = [
  {
    title: 'AI hội thoại',
    description: 'Luyện phản xạ bằng voice hoặc text với gợi ý sửa câu.',
    icon: 'chatbubbles-outline' as const,
    accent: '#EAF1FF',
  },
  {
    title: 'Dịch chuyên ngành',
    description: 'Dịch đoạn văn theo glossary cá nhân và ngữ cảnh học thuật.',
    icon: 'language-outline' as const,
    accent: '#EAF8F0',
  },
  {
    title: 'Nhập dữ liệu',
    description: 'Import CSV, book highlights hoặc danh sách từ từ lớp học.',
    icon: 'cloud-upload-outline' as const,
    accent: '#FFF1E8',
  },
  {
    title: 'Đọc sách kèm tra từ',
    description: 'Highlight, tra nghĩa, lưu note và tạo flashcard ngay khi đọc.',
    icon: 'reader-outline' as const,
    accent: '#F1ECFF',
  },
  {
    title: 'Flashcard thông minh',
    description: 'Tạo thẻ song ngữ, cloze test, phát âm và lịch ôn giãn cách.',
    icon: 'albums-outline' as const,
    accent: '#FFEFF3',
  },
  {
    title: 'Xuất bộ từ',
    description: 'Xuất sang CSV, Google Sheets hoặc Anki khi cần học ngoài app.',
    icon: 'download-outline' as const,
    accent: '#EAF7FA',
  },
];

export default function AdvancedScreen() {
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>Practice lab</Text>
        <Text style={styles.title}>Công cụ học nâng cao</Text>
        <View style={styles.challengeCard}>
          <View style={styles.challengeIcon}>
            <Ionicons name="flash" size={26} color="#FFFFFF" />
          </View>
          <View style={styles.challengeCopy}>
            <Text style={styles.challengeTitle}>18 từ cần ôn hôm nay</Text>
            <Text style={styles.challengeText}>Hoàn thành 3 vòng flashcard để giữ chuỗi 12 ngày.</Text>
          </View>
        </View>
        {features.map((feature) => (
          <TouchableOpacity key={feature.title} style={styles.card} activeOpacity={0.8}>
            <View style={[styles.iconWrap, { backgroundColor: feature.accent }]}>
              <Ionicons name={feature.icon} size={28} color="#0F172A" />
            </View>
            <View style={styles.copy}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.description}>{feature.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 24,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  kicker: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    color: '#0F172A',
    fontSize: 29,
    fontWeight: '900',
    marginBottom: 18,
    marginTop: 4,
  },
  challengeCard: {
    alignItems: 'center',
    backgroundColor: '#102A43',
    borderRadius: 8,
    flexDirection: 'row',
    marginBottom: 16,
    padding: 16,
  },
  challengeIcon: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    marginRight: 14,
    width: 48,
  },
  challengeCopy: {
    flex: 1,
  },
  challengeTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  challengeText: {
    color: '#BFDBFE',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 5,
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    flexDirection: 'row',
    marginBottom: 12,
    minHeight: 92,
    paddingHorizontal: 14,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 8,
    height: 52,
    justifyContent: 'center',
    marginRight: 14,
    width: 52,
  },
  copy: {
    flex: 1,
  },
  featureTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
  },
  description: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 8,
  },
});
