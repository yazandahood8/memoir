import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Digest } from '@memoir/shared';

function formatPeriod(start: string, end: string) {
  const s = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const e = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${s} – ${e}`;
}

function DigestCard({ digest, onPress }: { digest: Digest; onPress: () => void }) {
  const preview = digest.content.slice(0, 160).trim();
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} testID={`digest-card-${digest.id}`}>
      <View style={styles.cardHeader}>
        <View style={[styles.badge, digest.type === 'monthly' ? styles.badgeMonthly : styles.badgeWeekly]}>
          <Text style={styles.badgeText}>{digest.type === 'monthly' ? 'Monthly' : 'Weekly'}</Text>
        </View>
        <Text style={styles.period}>{formatPeriod(digest.period_start, digest.period_end)}</Text>
      </View>
      <Text style={styles.preview} numberOfLines={4}>{preview}…</Text>
    </TouchableOpacity>
  );
}

export default function DigestsScreen() {
  const router = useRouter();
  const { data: digests, isLoading } = useQuery({
    queryKey: ['digests'],
    queryFn: api.digests.list,
  });

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color="#6c63ff" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={digests ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DigestCard digest={item} onPress={() => router.push(`/digests/${item.id}`)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📬</Text>
            <Text style={styles.emptyTitle}>No digests yet</Text>
            <Text style={styles.emptyText}>
              Weekly digests are generated every Friday from your journal entries.
            </Text>
          </View>
        }
        contentContainerStyle={(digests?.length ?? 0) === 0 ? styles.emptyContainer : { paddingBottom: 40 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#1e1e2e', borderRadius: 12, padding: 16, marginHorizontal: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#2a2a3e',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeWeekly: { backgroundColor: 'rgba(108,99,255,0.2)' },
  badgeMonthly: { backgroundColor: 'rgba(57,211,83,0.15)' },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5 },
  period: { fontSize: 12, color: '#555' },
  preview: { fontSize: 14, color: '#ccc', lineHeight: 22 },
  empty: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 60 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 8 },
  emptyText: { color: '#555', textAlign: 'center', lineHeight: 22 },
});
