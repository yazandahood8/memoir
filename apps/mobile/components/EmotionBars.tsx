import { View, Text, StyleSheet } from 'react-native';

interface Props {
  emotions: Record<string, number>;
}

const COLORS: Record<string, string> = {
  joy: '#f5c518', sadness: '#4a9eff', wonder: '#a855f7', stress: '#ef4444',
  contentment: '#22c55e', nostalgia: '#fb923c', gratitude: '#ec4899', reflection: '#8b5cf6',
};

export function EmotionBars({ emotions }: Props) {
  return (
    <View style={styles.container}>
      {Object.entries(emotions).map(([emotion, value]) => (
        <View key={emotion} style={styles.row}>
          <Text style={styles.label}>{emotion}</Text>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${Math.round(value * 100)}%`, backgroundColor: COLORS[emotion] ?? '#6c63ff' },
              ]}
            />
          </View>
          <Text style={styles.value}>{Math.round(value * 100)}%</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { color: '#aaa', fontSize: 13, width: 90, textTransform: 'capitalize' },
  track: { flex: 1, height: 6, backgroundColor: '#2a2a3e', borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  value: { color: '#666', fontSize: 11, width: 36, textAlign: 'right' },
});
