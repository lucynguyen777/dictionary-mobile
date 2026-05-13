import { StyleSheet, Text, View } from 'react-native';

export default function SectionTitle({ title, action }: { title: string; action?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {action ? <Text style={styles.action}>{action}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  action: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
