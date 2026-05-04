import { useState } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { EntryCard } from '@/components/EntryCard';
import { Paywall } from '@/components/Paywall';
import type { Entry } from '@memoir/shared';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<Entry & { similarity: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await api.search.query(query);
      setResults(data.results);
    } catch (e: unknown) {
      const msg = (e as Error).message;
      if (msg.toLowerCase().includes('premium')) {
        setShowPaywall(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {showPaywall && (
        <Paywall
          feature="search"
          plan="free"
          onUpgrade={() => { setShowPaywall(false); router.push('/(tabs)/profile'); }}
          onDismiss={() => setShowPaywall(false)}
        />
      )}

      <View style={styles.searchRow}>
        <TextInput
          testID="search-input"
          style={styles.input}
          placeholder="Search your memories…"
          placeholderTextColor="#555"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>Go</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#6c63ff" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EntryCard entry={item} onPress={(id) => router.push(`/entry/${id}`)} />
          )}
          ListEmptyComponent={
            searched && !loading ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>No memories found</Text>
                <Text style={styles.emptyText}>Try different words or add more journal entries.</Text>
              </View>
            ) : !searched ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>✨</Text>
                <Text style={styles.emptyTitle}>Search your memories</Text>
                <Text style={styles.emptyText}>
                  Use natural language — "every time I felt homesick" or "my best meals abroad".
                </Text>
              </View>
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', padding: 16 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  input: {
    flex: 1, backgroundColor: '#1e1e2e', borderRadius: 12, padding: 14,
    color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#2a2a3e',
  },
  searchBtn: {
    backgroundColor: '#6c63ff', borderRadius: 12, paddingHorizontal: 20,
    justifyContent: 'center',
  },
  searchBtnText: { color: '#fff', fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 8 },
  emptyText: { color: '#555', textAlign: 'center', lineHeight: 22 },
});
