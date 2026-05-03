import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { RecordButton } from '@/components/RecordButton';
import { useRecording } from '@/hooks/useRecording';
import { supabase } from '@/lib/supabase';

export default function NewEntryScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'text' | 'voice'>('voice');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const { status, audioUri, duration, startRecording, stopRecording, error: recError } = useRecording();

  async function handleSave() {
    if (mode === 'text' && !text.trim()) {
      Alert.alert('Error', 'Please write something before saving.');
      return;
    }
    if (mode === 'voice' && !audioUri) {
      Alert.alert('Error', 'Please record something before saving.');
      return;
    }

    setSaving(true);
    try {
      if (mode === 'text') {
        await api.entries.create({ input_type: 'text', raw_text: text });
      } else {
        // Upload audio to Supabase Storage
        const { data: session } = await supabase.auth.getSession();
        const userId = session.session?.user.id;
        const filename = `${userId}/${Date.now()}.m4a`;

        const response = await fetch(audioUri!);
        const blob = await response.blob();
        const { error: uploadError } = await supabase.storage
          .from('audio')
          .upload(filename, blob, { contentType: 'audio/mp4' });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('audio').getPublicUrl(filename);
        await api.entries.create({
          input_type: 'voice',
          audio_url: urlData.publicUrl,
          audio_duration_seconds: duration,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['entries'] });
      router.back();
    } catch (e: unknown) {
      Alert.alert('Save failed', (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'voice' && styles.modeBtnActive]}
            onPress={() => setMode('voice')}
          >
            <Text style={[styles.modeBtnText, mode === 'voice' && styles.modeBtnTextActive]}>
              🎙 Voice
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'text' && styles.modeBtnActive]}
            onPress={() => setMode('text')}
          >
            <Text style={[styles.modeBtnText, mode === 'text' && styles.modeBtnTextActive]}>
              ✏️ Text
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'voice' ? (
          <View style={styles.voiceArea}>
            <RecordButton
              status={status}
              onStart={startRecording}
              onStop={stopRecording}
            />
            {recError ? <Text style={styles.error}>{recError}</Text> : null}
            {audioUri ? (
              <Text style={styles.recorded}>
                Recorded {duration}s — ready to save
              </Text>
            ) : (
              <Text style={styles.hint}>Tap to start recording</Text>
            )}
          </View>
        ) : (
          <TextInput
            testID="text-input"
            style={styles.textInput}
            placeholder="What happened today? How do you feel?…"
            placeholderTextColor="#555"
            value={text}
            onChangeText={setText}
            multiline
            textAlignVertical="top"
            maxLength={5000}
          />
        )}

        <TouchableOpacity
          testID="save-entry-button"
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save Entry</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  scroll: { padding: 24, flexGrow: 1 },
  modeToggle: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  modeBtn: {
    flex: 1, padding: 12, borderRadius: 10, alignItems: 'center',
    backgroundColor: '#1e1e2e', borderWidth: 1, borderColor: '#2a2a3e',
  },
  modeBtnActive: { backgroundColor: '#6c63ff', borderColor: '#6c63ff' },
  modeBtnText: { color: '#888', fontSize: 15, fontWeight: '500' },
  modeBtnTextActive: { color: '#fff' },
  voiceArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  hint: { color: '#555', marginTop: 16, fontSize: 14 },
  recorded: { color: '#6c63ff', marginTop: 16, fontSize: 14 },
  error: { color: '#ff6b6b', marginTop: 8, fontSize: 14 },
  textInput: {
    flex: 1, minHeight: 200, backgroundColor: '#1e1e2e', borderRadius: 12, padding: 16,
    color: '#fff', fontSize: 16, lineHeight: 26, borderWidth: 1, borderColor: '#2a2a3e',
    marginBottom: 24,
  },
  saveBtn: {
    backgroundColor: '#6c63ff', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
