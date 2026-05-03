import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Entry } from '@memoir/shared';

interface Props {
  entry: Entry;
  onPress: (id: string) => void;
  testID?: string;
}

const EMOTION_EMOJIS: Record<string, string> = {
  joy: '😊', sadness: '😢', wonder: '✨', stress: '😰',
  contentment: '😌', nostalgia: '🥹', gratitude: '🙏', reflection: '🪞',
};

export function EntryCard({ entry, onPress, testID }: Props) {
  const topEmotion = Object.entries(entry.emotions ?? {})
    .filter(([, v]) => v > 0.4)
    .sort(([, a], [, b]) => b - a)[0];

  return (
    <TouchableOpacity
      testID={testID ?? 'entry-card'}
      style={styles.card}
      onPress={() => onPress(entry.id)}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={[styles.badge, entry.input_type === 'voice' ? styles.voiceBadge : styles.textBadge]}>
          <Text testID="voice-badge" style={styles.badgeText}>
            {entry.input_type === 'voice' ? '🎙 Voice' : '✏️ Text'}
          </Text>
        </View>
        {!entry.processed && (
          <View testID="processing-indicator" style={styles.processingDot} />
        )}
        {topEmotion && (
          <Text style={styles.emotion}>{EMOTION_EMOJIS[topEmotion[0]] ?? ''}</Text>
        )}
      </View>

      <Text style={styles.transcript} numberOfLines={3}>
        {entry.transcript ?? entry.raw_text ?? ''}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.date}>
          {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
        {(entry.image_urls?.length ?? 0) > 0 && (
          <Text style={styles.photos}>{entry.image_urls.length} photos</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e1e2e', borderRadius: 14, padding: 16, marginHorizontal: 16, marginVertical: 6,
    borderWidth: 1, borderColor: '#2a2a3e',
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  voiceBadge: { backgroundColor: '#2a1f5e' },
  textBadge: { backgroundColor: '#1f3a2e' },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#aaa' },
  processingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6c63ff' },
  emotion: { marginLeft: 'auto', fontSize: 18 },
  transcript: { color: '#d0d0e0', fontSize: 15, lineHeight: 22, marginBottom: 10 },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
  date: { color: '#555', fontSize: 12 },
  photos: { color: '#6c63ff', fontSize: 12 },
});
