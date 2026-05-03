import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CollectionCard } from '@/components/CollectionCard';

export default function CollectionsScreen() {
  const router = useRouter();
  const { data, isLoading } = useQuery({ queryKey: ['collections'], queryFn: api.collections.list });

  if (isLoading) {
    return <View style={[styles.container, styles.centered]}><ActivityIndicator color="#6c63ff" size="large" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CollectionCard
            collection={item}
            onPress={(id) => router.push(`/collection/${id}`)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No collections yet</Text>
            <Text style={styles.emptySubtitle}>Group entries into a collection and let Memoir write your chapter.</Text>
          </View>
        }
        contentContainerStyle={(data?.length ?? 0) === 0 ? styles.emptyContainer : { paddingBottom: 100 }}
      />

      <TouchableOpacity
        testID="new-collection-button"
        style={styles.fab}
        onPress={() => router.push('/collection/new')}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 40 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#fff', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22 },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#6c63ff', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#6c63ff', shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  fabIcon: { fontSize: 28, color: '#fff', lineHeight: 32 },
});
