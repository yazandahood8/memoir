import { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Entry } from '@memoir/shared';

export default function AddEntriesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['entries'],
    queryFn: () => api.entries.list(1, 50),
  });

  const entries: Entry[] = data?.entries ?? [];

  function toggle(entryId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(entryId) ? next.delete(entryId) : next.add(entryId);
      return next;
    });
  }

  async function handleConfirm() {
    if (selected.size === 0) return;
    setSaving(true);
    try {
      await api.collections.addEntries(id, Array.from(selected));
      queryClient.invalidateQueries({ queryKey: ['collection', id] });
      router.back();
    } catch (e: unknown) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color="#6c63ff" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Entries</Text>
        <TouchableOpacity
          testID="confirm-add-button"
          onPress={handleConfirm}
          disabled={selected.size === 0 || saving}
        >
          {saving ? (
            <ActivityIndicator color="#6c63ff" size="small" />
          ) : (
            <Text style={[styles.confirm, selected.size === 0 && styles.confirmDisabled]}>
              Add ({selected.size})
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isSelected = selected.has(item.id);
          const preview = item.transcript ?? item.raw_text ?? '';
          return (
            <TouchableOpacity
              testID={`entry-checkbox-${item.id}`}
              style={[styles.row, isSelected && styles.rowSelected]}
              onPress={() => toggle(item.id)}
            >
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowType}>{item.input_type === 'voice' ? '🎙 Voice' : '✏️ Text'}</Text>
                <Text style={styles.rowPreview} numberOfLines={2}>
                  {preview || '(no transcript yet)'}
                </Text>
                <Text style={styles.rowDate}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>No entries yet</Text>
            <Text style={styles.emptyText}>Record a voice memo or write a text entry first, then add it here.</Text>
            <TouchableOpacity style={styles.createBtn} onPress={() => router.replace('/entry/new')}>
              <Text style={styles.createBtnText}>Create your first entry →</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#1e1e2e',
  },
  title: { fontSize: 17, fontWeight: '600', color: '#fff' },
  cancel: { color: '#888', fontSize: 16 },
  confirm: { color: '#6c63ff', fontSize: 16, fontWeight: '600' },
  confirmDisabled: { color: '#444' },
  row: {
    flexDirection: 'row', alignItems: 'flex-start', padding: 16,
    borderBottomWidth: 1, borderBottomColor: '#1a1a2e',
  },
  rowSelected: { backgroundColor: '#12122a' },
  checkbox: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: '#444', marginRight: 12, marginTop: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxSelected: { backgroundColor: '#6c63ff', borderColor: '#6c63ff' },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  rowContent: { flex: 1 },
  rowType: { fontSize: 12, color: '#6c63ff', marginBottom: 4 },
  rowPreview: { fontSize: 14, color: '#ccc', lineHeight: 20 },
  rowDate: { fontSize: 11, color: '#555', marginTop: 4 },
  empty: { padding: 40, alignItems: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 8 },
  emptyText: { color: '#555', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  createBtn: { backgroundColor: '#6c63ff', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  createBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
