import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import SkeletonBlock from '@/components/app/SkeletonBlock';
import { useToken } from '@/hooks/use-token';

import { type Props } from '../TabPager';
import { createTabPagerStyles, useTabPagerStyles, useTabPagerToken } from '@/components/word/tabs/tabPagerStyles';

type StateTone = 'loading' | 'success' | 'warning' | 'empty' | 'preview';

export function WordChip({
  sourceLang,
  targetLang,
  word,
  variant,
}: {
  sourceLang: string;
  targetLang: string;
  word: string;
  variant: 'primary' | 'ghost';
}) {
  const styles = useTabPagerStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={() => router.push({ pathname: '/word', params: { sourceLang, targetLang, word } })}
      style={variant === 'primary' ? styles.chipButton : styles.ghostChipButton}>
      <Text style={variant === 'primary' ? styles.chipText : styles.ghostChipText}>{word}</Text>
    </TouchableOpacity>
  );
}

export function LookupBanner({
  error,
  source,
  status,
  successText,
}: {
  error: string;
  source?: string;
  status: Props['lookupStatus'];
  successText: string;
}) {
  if (status === 'loading') {
    return (
      <StateCard
        icon="hourglass-outline"
        text="Đang lấy dữ liệu nghĩa, từ liên quan và nguồn song ngữ nếu có."
        title="Đang tải dữ liệu"
        tone="loading"
      />
    );
  }

  if (status === 'error') {
    if (error) console.warn('Lookup error:', error);

    return (
      <StateCard
        icon="alert-circle-outline"
        text={'Không tải được dữ liệu trực tuyến. Ứng dụng sẽ dùng dữ liệu local/dự phòng nếu có.'}
        title="Đang dùng dữ liệu dự phòng"
        tone="warning"
      />
    );
  }

  if (status === 'ready') {
    return (
      <StateCard
        icon="checkmark-circle-outline"
        text={source ? `Nguồn: ${source}` : 'Dữ liệu đã sẵn sàng.'}
        title={successText}
        tone="success"
      />
    );
  }

  return null;
}

export function EmptyState({ text }: { text: string }) {
  return <StateCard icon="document-text-outline" text={text} title="Chưa có dữ liệu" tone="empty" />;
}

export function uniqueWords(words: string[]) {
  return Array.from(new Set(words.map((word) => word.trim()).filter(Boolean))).slice(0, 24);
}

export function PreviewNotice({ title, text }: { title: string; text: string }) {
  return <StateCard icon="information-circle-outline" text={text} title={title} tone="preview" />;
}

function StateCard({
  icon,
  text,
  title,
  tone,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  title: string;
  tone: StateTone;
}) {
  const styles = useTabPagerStyles();
  const { colors } = useTabPagerToken();
  const toneStyle = getStateToneStyle(tone, colors, styles);

  return (
    <View style={[styles.stateCard, toneStyle.card]}>
      <Ionicons name={icon} size={20} color={toneStyle.iconColor} />
      <View style={styles.stateCopy}>
        <Text style={[styles.stateTitle, toneStyle.title]}>{title}</Text>
        {tone === 'loading' ? (
          <View style={styles.loadingSkeletonStack}>
            <SkeletonBlock height={10} width="92%" />
            <SkeletonBlock height={10} width="68%" />
          </View>
        ) : (
          <Text style={[styles.stateText, toneStyle.text]}>{text}</Text>
        )}
      </View>
    </View>
  );
}

function getStateToneStyle(
  tone: StateTone,
  colors: ReturnType<typeof useToken>['colors'],
  styles: ReturnType<typeof createTabPagerStyles>
) {
  if (tone === 'success') {
    return {
      card: styles.successStateCard,
      iconColor: colors.accentSuccess,
      text: styles.successStateText,
      title: styles.successStateTitle,
    };
  }

  if (tone === 'warning') {
    return {
      card: styles.warningStateCard,
      iconColor: colors.accentWarning,
      text: styles.warningStateText,
      title: styles.warningStateTitle,
    };
  }

  if (tone === 'empty') {
    return {
      card: styles.emptyStateCard,
      iconColor: colors.textSecondary,
      text: styles.emptyStateText,
      title: styles.emptyStateTitle,
    };
  }

  if (tone === 'preview') {
    return {
      card: styles.previewStateCard,
      iconColor: colors.accentWarning,
      text: styles.warningStateText,
      title: styles.warningStateTitle,
    };
  }

  return {
    card: styles.loadingStateCard,
    iconColor: colors.accentPrimary,
    text: styles.loadingStateText,
    title: styles.loadingStateTitle,
  };
}
