import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import Touchable from '@/components/app/Touchable';
import { DEFAULT_FOLDER_COLOR, folderColorOptions } from '@/components/library/FolderMetadataEditor';
import { styles } from '@/components/library/styles';
import { type Folder, type LibraryState, renameFolder, updateFolderColorAndNote } from '@/data/libraryStore';

type SheetProps = {
  folder: Folder;
  libraryState: LibraryState;
  onClose: () => void;
  onLibraryChange: (state: LibraryState) => void;
};

// Folder color and color note, opened from a folder's menu in Library.
export function FolderColorSheet({ folder, libraryState, onClose, onLibraryChange }: SheetProps) {
  const [selectedColor, setSelectedColor] = useState(folder.color);
  const [colorNote, setColorNote] = useState(folder.colorNote ?? '');

  const handleSave = () => {
    updateFolderColorAndNote(libraryState, folder.id, selectedColor || folder.color || DEFAULT_FOLDER_COLOR, colorNote).then((nextState) => {
      onLibraryChange(nextState);
      onClose();
    });
  };

  return (
    <View style={styles.colorPickerOverlay}>
      <Touchable style={styles.colorPickerBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.colorPickerSheet}>
        <Text style={styles.colorPickerTitle}>Chọn màu cho bộ từ</Text>
        <View style={styles.colorSwatchRow}>
          {folderColorOptions.map((color) => (
            <Touchable
              key={color}
              accessibilityLabel={`Màu ${color}`}
              accessibilityState={{ selected: selectedColor === color }}
              activeOpacity={0.85}
              onPress={() => setSelectedColor(color)}
              style={[styles.colorSwatch, { backgroundColor: color }, selectedColor === color ? styles.colorSwatchSelected : null]}
            />
          ))}
        </View>
        <TextInput
          value={colorNote}
          onChangeText={setColorNote}
          placeholder="Ghi chú cho màu này (ví dụ: 'Học vựng hằng ngày')"
          placeholderTextColor="#94A3B8"
          style={styles.colorNoteInput}
        />
        <View style={styles.colorPickerActions}>
          <Touchable onPress={onClose} style={styles.colorPickerCancel}>
            <Text style={styles.colorPickerCancelText}>Hủy</Text>
          </Touchable>
          <Touchable activeOpacity={0.85} onPress={handleSave} style={styles.colorPickerSave}>
            <Text style={styles.colorPickerSaveText}>Lưu</Text>
          </Touchable>
        </View>
      </View>
    </View>
  );
}

// Rename a folder; names must be non-empty and unique (case-insensitive).
export function RenameFolderSheet({ folder, libraryState, onClose, onLibraryChange }: SheetProps) {
  const [name, setName] = useState(folder.name);
  const [error, setError] = useState('');

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Tên không được để trống');
      return;
    }
    if (libraryState.folders.some((other) => other.name.toLowerCase() === trimmed.toLowerCase() && other.id !== folder.id)) {
      setError('Tên bộ từ đã tồn tại');
      return;
    }
    renameFolder(libraryState, folder.id, trimmed).then((nextState) => {
      onLibraryChange(nextState);
      onClose();
    });
  };

  return (
    <View style={styles.colorPickerOverlay}>
      <Touchable style={styles.colorPickerBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.colorPickerSheet}>
        <Text style={styles.colorPickerTitle}>Đổi tên bộ từ</Text>
        <TextInput
          value={name}
          onChangeText={(text) => {
            setName(text);
            setError('');
          }}
          placeholder="Tên mới cho bộ từ"
          placeholderTextColor="#94A3B8"
          style={styles.renameInput}
        />
        {error ? <Text style={styles.renameError}>{error}</Text> : null}
        <View style={styles.colorPickerActions}>
          <Touchable onPress={onClose} style={styles.colorPickerCancel}>
            <Text style={styles.colorPickerCancelText}>Hủy</Text>
          </Touchable>
          <Touchable activeOpacity={0.85} onPress={handleSave} style={styles.colorPickerSave}>
            <Text style={styles.colorPickerSaveText}>Lưu</Text>
          </Touchable>
        </View>
      </View>
    </View>
  );
}
