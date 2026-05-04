import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { EntryCard } from '@/components/EntryCard';

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: collection, isLoading } = useQuery({
    queryKey: ['collection', id],
    queryFn: () => api.collections.get(id),
  });

  const { data: chapterData } = useQuery({
    queryKey: ['chapter', id],
    queryFn: () => api.chapters.get(id),
    enabled: collection?.status === 'closed',
    retry: false,
  });

  async function handleClose() {
    Alert.alert(
      'Close Collection',
      'This will lock the collection and start writing your chapter. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close & Write Chapter',
          onPress: async () => {
            try {
              await api.collections.close(id);
              queryClient.invalidateQueries({ queryKey: ['collection', id] });
              queryClient.invalidateQueries({ queryKey: ['collections'] });
            } catch (e: unknown) {
              Alert.alert('Error', (e as Error).message);
            }
          },
        },
      ]
    );
  }

  if (isLoading) {
    return <View style={[styles.container, styles.centered]}><ActivityIndicator color="#6c63ff" size="large" /></View>;
  }

  if (!collection) return null;

  const entries = (collection as { collection_entries?: { entries: unknown }[] }).collection_entries?.map((ce) => ce.entries) ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{collection.name}</Text>
        {collection.status === 'closed' && chapterData && (
          <TouchableOpacity style={styles.chapterBtn} onPress={() => router.push(`/collection/chapter?id=${id}`)}>
            <Text style={styles.chapterBtnText}>Read Chapter →</Text>
          </TouchableOpacity>
        )}
        {collection.status === 'closed' && !chapterData && (
          <View testID="chapter-pending-badge" style={styles.pendingBadge}>
            <Text style={styles.pendingText}>✨ Chapter generating…</Text>
          </View>
        )}
        {collection.status === 'active' && (
          <TouchableOpacity
            testID="close-collection-button"
            style={styles.closeBtn}
            onPress={handleClose}
          >
            <Text style={styles.closeBtnText}>Close & Write Chapter</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={entries as { id: string }[]}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <EntryCard
            testID={`entry-in-collection-${index}`}
            entry={item as Parameters<typeof EntryCard>[0]['entry']}
            onPress={(eid) => router.push(`/entry/${eid}`)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              Tap <Text style={styles.emptyHighlight}>+</Text> to add entries from your journal, or{' '}
              <Text style={styles.emptyHighlight}>create a new entry</Text> from the Entries tab first.
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {collection.status === 'active' && (
        <TouchableOpacity
          testID="add-entries-button"
          style={styles.fab}
          onPress={() => router.push(`/collection/add-entries?id=${id}`)}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { padding: 24, paddingBottom: 12 },
  name: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 12 },
  chapterBtn: { backgroundColor: '#6c63ff', borderRadius: 10, padding: 12, alignItems: 'center' },
  chapterBtnText: { color: '#fff', fontWeight: '600' },
  pendingBadge: { backgroundColor: '#1e1e2e', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#6c63ff' },
  pendingText: { color: '#6c63ff', fontSize: 13, textAlign: 'center' },
  closeBtn: { backgroundColor: '#1e1e2e', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#6c63ff', alignItems: 'center' },
  closeBtnText: { color: '#6c63ff', fontWeight: '600' },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#555', textAlign: 'center', lineHeight: 22 },
  emptyHighlight: { color: '#6c63ff', fontWeight: '600' },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#6c63ff', justifyContent: 'center', alignItems: 'center', elevation: 6,
  },
  fabIcon: { fontSize: 26, color: '#fff', lineHeight: 30 },
});
