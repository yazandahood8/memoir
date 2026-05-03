import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function NewCollectionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!name.trim()) { Alert.alert('Error', 'Please give this collection a name.'); return; }
    setSaving(true);
    try {
      await api.collections.create({ name, description: description || undefined });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      router.back();
    } catch (e: unknown) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.inner}>
        <Text style={styles.title}>New Collection</Text>

        <TextInput
          testID="collection-name-input"
          style={styles.input}
          placeholder="Collection name (e.g. Tokyo Trip)"
          placeholderTextColor="#555"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Description (optional)"
          placeholderTextColor="#555"
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
        />

        <TouchableOpacity
          testID="create-collection-button"
          style={[styles.btn, saving && styles.btnDisabled]}
          onPress={handleCreate}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Collection</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  inner: { flex: 1, padding: 24 },
  title: { fontSize: 28, fontWeight: '600', color: '#fff', marginBottom: 24 },
  input: { backgroundColor: '#1e1e2e', borderRadius: 12, padding: 16, color: '#fff', fontSize: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a3e' },
  textarea: { minHeight: 100 },
  btn: { backgroundColor: '#6c63ff', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
