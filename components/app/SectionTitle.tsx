import { Text, View } from 'react-native';

import { useToken } from '@/hooks/use-token';

export default function SectionTitle({ title, action }: { title: string; action?: string }) {
  const { colors, spacing, typography } = useToken();

  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xl }}>
      <Text style={{ color: colors.textPrimary, fontSize: typography.h3.fontSize, fontWeight: '700' }}>{title}</Text>
      {action ? (
        <Text style={{ color: colors.accentPrimary, fontSize: typography.bodySm.fontSize, fontWeight: '600', textDecorationLine: 'underline' }}>
          {action}
        </Text>
      ) : null}
    </View>
  );
}
