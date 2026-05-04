import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Share, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

function formatPeriod(start: string, end: string) {
  const s = new Date(start).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const e = new Date(end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return `${s} – ${e}`;
}

export default function DigestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: digest, isLoading } = useQuery({
    queryKey: ['digest', id],
    queryFn: () => api.digests.get(id),
  });

  async function handleShare() {
    if (!digest) return;
    await Share.share({ message: digest.content, title: 'My Memoir Digest' });
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color="#6c63ff" size="large" />
      </View>
    );
  }

  if (!digest) return null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.meta}>
          <View style={[styles.badge, digest.type === 'monthly' ? styles.badgeMonthly : styles.badgeWeekly]}>
            <Text style={styles.badgeText}>{digest.type === 'monthly' ? 'Monthly Digest' : 'Weekly Digest'}</Text>
          </View>
          <Text style={styles.period}>{formatPeriod(digest.period_start, digest.period_end)}</Text>
        </View>

        <Text style={styles.prose}>{digest.content}</Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareBtnText}>Share digest</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>← All digests</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 24 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeWeekly: { backgroundColor: 'rgba(108,99,255,0.2)' },
  badgeMonthly: { backgroundColor: 'rgba(57,211,83,0.15)' },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5 },
  period: { fontSize: 13, color: '#555' },
  prose: { fontSize: 16, lineHeight: 28, color: '#ddd', letterSpacing: 0.1, marginBottom: 40 },
  actions: { gap: 10 },
  shareBtn: {
    backgroundColor: '#6c63ff', borderRadius: 12, padding: 15, alignItems: 'center',
  },
  shareBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  backBtn: { padding: 15, alignItems: 'center' },
  backBtnText: { color: '#6c63ff', fontSize: 14 },
});
