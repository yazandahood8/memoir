import { View, Text, ScrollView, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { EmotionBars } from '@/components/EmotionBars';

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: entry, isLoading } = useQuery({
    queryKey: ['entry', id],
    queryFn: () => api.entries.get(id),
  });

  if (isLoading) {
    return <View style={[styles.container, styles.centered]}><ActivityIndicator color="#6c63ff" size="large" /></View>;
  }

  if (!entry) return null;

  const topEmotions = Object.entries(entry.emotions ?? {})
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.date}>{new Date(entry.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>

      {entry.input_type === 'voice' && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🎙 Voice Entry</Text>
        </View>
      )}

      {!entry.processed && (
        <View style={styles.processingBanner}>
          <Text style={styles.processingText}>✨ Processing your entry…</Text>
        </View>
      )}

      <Text style={styles.transcript}>{entry.transcript ?? entry.raw_text}</Text>

      {entry.image_urls?.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photos}>
          {entry.image_urls.map((url, i) => (
            <Image key={i} source={{ uri: url }} style={styles.photo} />
          ))}
        </ScrollView>
      )}

      {topEmotions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emotions</Text>
          <EmotionBars emotions={Object.fromEntries(topEmotions)} />
        </View>
      )}

      {entry.topics?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Topics</Text>
          <View style={styles.tags}>
            {entry.topics.map((t) => (
              <View key={t} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: 24, paddingBottom: 60 },
  date: { color: '#888', fontSize: 13, marginBottom: 12 },
  badge: { alignSelf: 'flex-start', backgroundColor: '#1e1e2e', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 12 },
  badgeText: { color: '#6c63ff', fontSize: 12, fontWeight: '600' },
  processingBanner: { backgroundColor: '#1e1e2e', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#6c63ff' },
  processingText: { color: '#6c63ff', fontSize: 13, textAlign: 'center' },
  transcript: { color: '#e0e0e0', fontSize: 17, lineHeight: 28, marginBottom: 24 },
  photos: { marginBottom: 24 },
  photo: { width: 200, height: 150, borderRadius: 10, marginRight: 8 },
  section: { marginBottom: 20 },
  sectionTitle: { color: '#888', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: '#1e1e2e', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  tagText: { color: '#aaa', fontSize: 13 },
});
