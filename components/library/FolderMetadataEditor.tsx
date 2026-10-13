import { Text, TextInput, View } from 'react-native';
import Touchable from '@/components/app/Touchable';

import { useLibraryStyles } from '@/components/library/styles';
import { FOLDER_COLOR_OPTIONS } from '@/constants/pastels';
import { useToken } from '@/hooks/use-token';


export function FolderMetadataEditor({
  avatarUri,
  color,
  colorNote,
  onAvatarUriChange,
  onColorChange,
  onColorNoteChange,
  onTagsChange,
  tags,
}: {
  avatarUri: string;
  color: string;
  colorNote: string;
  onAvatarUriChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onColorNoteChange: (value: string) => void;
  onTagsChange: (value: string) => void;
  tags: string;
}) {
  const { colors } = useToken();
  const styles = useLibraryStyles();
  return (
    <View style={styles.metadataPanel}>
      <Text style={styles.metadataTitle}>Tùy chỉnh bộ từ</Text>
      <View style={styles.colorSwatchRow}>
        {FOLDER_COLOR_OPTIONS.map((option) => (
          <Touchable
            key={option}
            accessibilityLabel={`Màu ${option}`}
            accessibilityState={{ selected: color === option }}
            activeOpacity={0.85}
            onPress={() => onColorChange(option)}
            style={[styles.colorSwatch, { backgroundColor: option }, color === option && styles.colorSwatchSelected]}
          />
        ))}
      </View>
      <TextInput
        onChangeText={onColorNoteChange}
        placeholder="Ghi chú màu sắc"
        placeholderTextColor={colors.textTertiary}
        style={styles.metadataInput}
        value={colorNote}
      />
      <TextInput
        onChangeText={onTagsChange}
        placeholder="Tag, phân tách bằng dấu phẩy"
        placeholderTextColor={colors.textTertiary}
        style={styles.metadataInput}
        value={tags}
      />
      <TextInput
        autoCapitalize="none"
        onChangeText={onAvatarUriChange}
        placeholder="Ảnh đại diện URL"
        placeholderTextColor={colors.textTertiary}
        style={styles.metadataInput}
        value={avatarUri}
      />
    </View>
  );
}

export function parseTagDraft(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}
