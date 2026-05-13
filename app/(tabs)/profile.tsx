import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import Screen from '@/components/app/Screen';

const days = Array.from({ length: 84 }, (_, index) => index);
const chartValues = [1, 1.5, 2, 2.4, 4.6, 6.4, 5.5, 7.3, 9.1, 11.2, 10.5, 13.1, 15.5, 12.6, 17.5, 16.1, 23.6];

export default function ProfileScreen() {
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Ionicons name="menu" size={27} color="#111111" />
          <Text style={styles.signOut}>Sign-out</Text>
        </View>

        <Image source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&h=240&fit=crop' }} style={styles.avatar} />
        <Text style={styles.userName}>User_name</Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Year_contribution</Text>
            <View style={styles.yearPill}>
              <Text>Year</Text>
              <Ionicons name="caret-down" size={14} color="#111111" />
            </View>
          </View>
          <View style={styles.heatmapRow}>
            <View style={styles.weekLabels}>
              <Text style={styles.weekLabel}>Mon</Text>
              <Text style={styles.weekLabel}>Wed</Text>
              <Text style={styles.weekLabel}>Fri</Text>
            </View>
            <View style={styles.heatmap}>
              {days.map((day) => (
                <View key={day} style={[styles.square, day % 7 > 3 && styles.squareStrong, day % 13 === 0 && styles.squareDark]} />
              ))}
            </View>
          </View>
          <View style={styles.legend}>
            <Text style={styles.legendText}>Less</Text>
            {[0, 1, 2, 3, 4].map((item) => (
              <View key={item} style={[styles.legendSquare, item > 2 && styles.squareStrong]} />
            ))}
            <Text style={styles.legendText}>More</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Number_of_word_added_per_day</Text>
          <View style={styles.chart}>
            {[25, 20, 15, 10, 5].map((tick) => (
              <View key={tick} style={styles.gridLine}>
                <Text style={styles.tick}>{tick}</Text>
                <View style={styles.gridRule} />
              </View>
            ))}
            <View style={styles.lineArea}>
              {chartValues.map((value, index) => (
                <View key={`${value}-${index}`} style={[styles.lineDot, { left: `${(index / (chartValues.length - 1)) * 100}%`, bottom: `${(value / 25) * 100}%` }]} />
              ))}
            </View>
            <View style={styles.chartFooter}>
              {['Nov 23', '24', '25', '26', '27', '28', '29', '30'].map((label) => (
                <Text key={label} style={styles.dateLabel}>{label}</Text>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 28,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signOut: {
    fontSize: 16,
  },
  avatar: {
    alignSelf: 'center',
    borderRadius: 48,
    height: 96,
    marginTop: 10,
    width: 96,
  },
  userName: {
    alignSelf: 'center',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 48,
    marginTop: 16,
  },
  card: {
    borderColor: '#DDDDDD',
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 8,
    overflow: 'hidden',
    padding: 12,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  yearPill: {
    alignItems: 'center',
    borderColor: '#DDDDDD',
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    height: 28,
    paddingHorizontal: 13,
  },
  heatmapRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  weekLabels: {
    justifyContent: 'space-around',
    marginRight: 4,
  },
  weekLabel: {
    color: '#8E8E8E',
    fontSize: 7,
  },
  heatmap: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  square: {
    backgroundColor: '#E2E2E2',
    borderRadius: 2,
    height: 8,
    width: 8,
  },
  squareStrong: {
    backgroundColor: '#D0D0D0',
  },
  squareDark: {
    backgroundColor: '#BEBEBE',
  },
  legend: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 5,
  },
  legendText: {
    fontSize: 9,
    marginHorizontal: 4,
  },
  legendSquare: {
    backgroundColor: '#E2E2E2',
    borderRadius: 2,
    height: 8,
    marginHorizontal: 1,
    width: 8,
  },
  chart: {
    height: 210,
    marginTop: 20,
  },
  gridLine: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 35,
  },
  tick: {
    color: '#8A8A8A',
    fontSize: 10,
    width: 32,
  },
  gridRule: {
    backgroundColor: '#EFEFEF',
    flex: 1,
    height: 1,
  },
  lineArea: {
    bottom: 34,
    left: 34,
    position: 'absolute',
    right: 10,
    top: 6,
  },
  lineDot: {
    backgroundColor: '#2F70FF',
    borderRadius: 4,
    height: 8,
    marginLeft: -4,
    marginTop: -4,
    position: 'absolute',
    width: 8,
  },
  chartFooter: {
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  dateLabel: {
    color: '#8A8A8A',
    fontSize: 11,
  },
});
