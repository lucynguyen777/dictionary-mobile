import { Text, TextInput, View } from 'react-native';
import Touchable from '@/components/app/Touchable';

import { styles } from '@/components/library/styles';

// User-selectable folder colors: soft pastels that stay light in both themes (ink: textOnPastel).
export const folderColorOptions = ['#E8F0FF', '#EAF8F0', '#FFF1E8', '#F1ECFF', '#FFEFF3', '#EAF7FA'];
export const DEFAULT_FOLDER_COLOR = folderColorOptions[0];

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
  return (
    <View style={styles.metadataPanel}>
      <Text style={styles.metadataTitle}>Tùy chỉnh bộ từ</Text>
      <View style={styles.colorSwatchRow}>
        {folderColorOptions.map((option) => (
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
        placeholderTextColor="#94A3B8"
        style={styles.metadataInput}
        value={colorNote}
      />
      <TextInput
        onChangeText={onTagsChange}
        placeholder="Tag, phân tách bằng dấu phẩy"
        placeholderTextColor="#94A3B8"
        style={styles.metadataInput}
        value={tags}
      />
      <TextInput
        autoCapitalize="none"
        onChangeText={onAvatarUriChange}
        placeholder="Ảnh đại diện URL"
        placeholderTextColor="#94A3B8"
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
