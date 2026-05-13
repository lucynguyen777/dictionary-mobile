import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Screen from '@/components/app/Screen';
import { dictionaryEntries, savedFolders } from '@/data/dictionary';

export default function LibraryScreen() {
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>Library</Text>
            <Text style={styles.title}>Tủ từ của bạn</Text>
          </View>
          <TouchableOpacity activeOpacity={0.85} style={styles.addButton}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.segment}>
          <Text style={styles.segmentActive}>Bộ từ</Text>
          <Text style={styles.segmentText}>Yêu thích</Text>
          <Text style={styles.segmentText}>Đã nhập</Text>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#2563EB" />
          <Text style={styles.placeholder}>Tìm folder hoặc từ đã lưu</Text>
        </View>

        <View style={styles.toolbar}>
          <View style={styles.toolbarLeft}>
            <Ionicons name="swap-vertical" size={18} color="#64748B" />
            <Text style={styles.toolbarText}>Sắp xếp theo gần đây</Text>
          </View>
          <View style={styles.viewToggle}>
            <Ionicons name="grid" size={18} color="#2563EB" />
            <Ionicons name="list-outline" size={19} color="#94A3B8" />
          </View>
        </View>

        <View style={styles.grid}>
          {savedFolders.map((folder) => (
            <TouchableOpacity key={folder.name} style={styles.folderCard} activeOpacity={0.85}>
              <View style={[styles.cover, { backgroundColor: folder.color }]}>
                <Ionicons name="folder-open-outline" size={28} color="#0F172A" />
              </View>
              <View style={styles.folderInfo}>
                <View style={styles.folderCopy}>
                  <Text numberOfLines={1} style={styles.folderName}>{folder.name}</Text>
                  <Text style={styles.wordNumber}>{folder.words} words</Text>
                </View>
                <Ionicons name="ellipsis-horizontal" size={18} color="#64748B" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Vừa lưu</Text>
        {dictionaryEntries.slice(0, 3).map((entry) => (
          <TouchableOpacity key={entry.word} activeOpacity={0.82} style={styles.savedWord}>
            <View>
              <Text style={styles.savedWordTitle}>{entry.word}</Text>
              <Text style={styles.savedWordMeta}>{entry.vietnamese} · {entry.level}</Text>
            </View>
            <View style={styles.savedTag}>
              <Text style={styles.savedTagText}>{entry.topic}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 28,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    marginTop: 4,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 18,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  segment: {
    backgroundColor: '#EAF1FF',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    marginTop: 18,
    padding: 5,
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    color: '#2563EB',
    flex: 1,
    fontSize: 13,
    fontWeight: '900',
    overflow: 'hidden',
    paddingVertical: 9,
    textAlign: 'center',
  },
  segmentText: {
    color: '#64748B',
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    paddingVertical: 9,
    textAlign: 'center',
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 10,
    height: 48,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  placeholder: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  toolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  toolbarLeft: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  toolbarText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  viewToggle: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 18,
  },
  folderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 12,
    padding: 10,
    width: '48%',
  },
  cover: {
    alignItems: 'center',
    borderRadius: 8,
    height: 86,
    justifyContent: 'center',
  },
  folderInfo: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  folderCopy: {
    flex: 1,
  },
  folderName: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
  },
  wordNumber: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 12,
    marginTop: 14,
  },
  savedWord: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    padding: 14,
  },
  savedWordTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '900',
  },
  savedWordMeta: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  savedTag: {
    backgroundColor: '#EEF4FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  savedTagText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '900',
  },
});
