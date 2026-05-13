import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Screen from '@/components/app/Screen';

const folders = [
  'IELTS Speaking',
  'Travel phrases',
  'Phrasal verbs',
  'Business English',
  'Imported CSV',
  'Anki export',
  'Idioms',
  'Academic verbs',
  'Favorites',
  'Book highlights',
  'Medical translation',
  'Daily review',
];

export default function LibraryScreen() {
  return (
    <Screen>
      <View style={styles.tabs}>
        <Text style={styles.inactiveTab}>Discovery</Text>
        <View style={styles.activeTabWrapper}>
          <Text style={styles.activeTab}>Your library</Text>
          <View style={styles.underline} />
        </View>
        <Text style={styles.inactiveTab}>Favorites</Text>
      </View>

      <View style={styles.searchBox}>
        <Text style={styles.placeholder}>Folder_name...</Text>
        <Ionicons name="search" size={22} color="#111111" />
      </View>

      <View style={styles.toolbar}>
        <View style={styles.toolbarLeft}>
          <Ionicons name="swap-vertical" size={20} color="#111111" />
          <Text style={styles.toolbarText}>Recent</Text>
        </View>
        <View style={styles.viewToggle}>
          <Ionicons name="list" size={19} color="#999999" />
          <Ionicons name="grid-outline" size={18} color="#111111" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {folders.map((folder, index) => (
          <TouchableOpacity key={folder} style={styles.folderCard} activeOpacity={0.8}>
            <View style={styles.cover}>
              <Text style={styles.coverText}>Page_cover</Text>
            </View>
            <View style={styles.folderInfo}>
              <View>
                <Text numberOfLines={1} style={styles.folderName}>{folder}</Text>
                <Text style={styles.wordNumber}>{24 + index * 3} words</Text>
              </View>
              <Ionicons name="ellipsis-vertical" size={17} color="#111111" />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 32,
    paddingTop: 16,
  },
  inactiveTab: {
    color: '#909090',
    fontSize: 15,
    fontWeight: '700',
  },
  activeTabWrapper: {
    alignItems: 'center',
  },
  activeTab: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '800',
  },
  underline: {
    backgroundColor: '#111111',
    height: 2,
    marginTop: 8,
    width: 24,
  },
  searchBox: {
    alignItems: 'center',
    borderColor: '#DDDDDD',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    height: 36,
    justifyContent: 'space-between',
    marginHorizontal: 21,
    marginTop: 10,
    paddingHorizontal: 16,
  },
  placeholder: {
    color: '#B7B7B7',
    fontSize: 16,
  },
  toolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 36,
    marginTop: 18,
  },
  toolbarLeft: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  toolbarText: {
    fontSize: 13,
  },
  viewToggle: {
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 28,
    paddingHorizontal: 38,
    paddingTop: 35,
  },
  folderCard: {
    marginBottom: 18,
    width: 84,
  },
  cover: {
    alignItems: 'center',
    borderColor: '#111111',
    borderWidth: 1,
    height: 74,
    justifyContent: 'center',
    width: 84,
  },
  coverText: {
    fontSize: 8,
  },
  folderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  folderName: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
    width: 66,
  },
  wordNumber: {
    fontSize: 8,
    marginTop: 2,
  },
});
