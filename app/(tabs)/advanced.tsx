import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Screen from '@/components/app/Screen';

const features = [
  {
    title: 'Botchat',
    description: 'Real-time voice and text conversation for language practice.',
    icon: 'chatbubbles-outline' as const,
  },
  {
    title: 'Specialized translation',
    description: 'Translate domain text with imported terminology databases.',
    icon: 'language-outline' as const,
  },
  {
    title: 'Import datasets',
    description: 'Map rows or columns into folders, notes, and flashcard keys.',
    icon: 'cloud-upload-outline' as const,
  },
  {
    title: 'Book reader',
    description: 'Highlight words, look up meanings, save notes, and adjust reading theme.',
    icon: 'reader-outline' as const,
  },
  {
    title: 'Flashcard builder',
    description: 'Create bilingual, definition, and pronunciation drill cards.',
    icon: 'albums-outline' as const,
  },
  {
    title: 'Export center',
    description: 'Export folders to CSV, Excel, Google Sheets, and Anki packages.',
    icon: 'download-outline' as const,
  },
];

export default function AdvancedScreen() {
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Advance_feature</Text>
        {features.map((feature) => (
          <TouchableOpacity key={feature.title} style={styles.card} activeOpacity={0.8}>
            <Ionicons name={feature.icon} size={31} color="#222222" style={styles.icon} />
            <View style={styles.copy}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.description}>{feature.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 24,
    paddingHorizontal: 26,
    paddingTop: 42,
  },
  title: {
    fontSize: 31,
    fontWeight: '800',
    letterSpacing: -0.7,
    marginBottom: 22,
    marginLeft: 22,
  },
  card: {
    alignItems: 'center',
    borderColor: '#D9D9D9',
    borderRadius: 7,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 25,
    minHeight: 96,
    paddingHorizontal: 24,
  },
  icon: {
    marginRight: 24,
  },
  copy: {
    flex: 1,
  },
  featureTitle: {
    color: '#222222',
    fontSize: 24,
    fontWeight: '800',
  },
  description: {
    color: '#777777',
    fontSize: 17,
    marginTop: 8,
  },
});
