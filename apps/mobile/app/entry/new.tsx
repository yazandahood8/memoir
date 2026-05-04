import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { api } from '@/lib/api';
import { RecordButton } from '@/components/RecordButton';
import { PhotoStrip } from '@/components/PhotoStrip';
import { Paywall } from '@/components/Paywall';
import { useRecording } from '@/hooks/useRecording';
import { supabase } from '@/lib/supabase';
import type { Plan } from '@memoir/shared';

const MAX_PHOTOS = 5;

export default function NewEntryScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'text' | 'voice'>('voice');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [plan, setPlan] = useState<Plan>('free');
  const [showPaywall, setShowPaywall] = useState(false);
  const { status, audioUri, duration, startRecording, stopRecording, error: recError } = useRecording();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user.id;
      if (!uid) return;
      supabase.from('users').select('plan').eq('id', uid).single()
        .then(({ data: u }) => { if (u?.plan) setPlan(u.plan as Plan); });
    });
  }, []);

  async function pickPhoto() {
    if (plan !== 'premium') { setShowPaywall(true); return; }
    if (photoUris.length >= MAX_PHOTOS) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsMultipleSelection: false,
    });
    if (result.canceled || !result.assets[0]) return;

    // Compress to max 1200px wide using v13 chainable API
    const image = await ImageManipulator.manipulate(result.assets[0].uri)
      .resize({ width: 1200 })
      .renderAsync();
    const saved = await image.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
    setPhotoUris(prev => [...prev, saved.uri]);
  }

  function removePhoto(index: number) {
    setPhotoUris(prev => prev.filter((_, i) => i !== index));
  }

  async function uploadPhotos(userId: string): Promise<string[]> {
    const urls: string[] = [];
    for (const uri of photoUris) {
      const filename = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      const response = await fetch(uri);
      const blob = await response.blob();
      const { error } = await supabase.storage.from('images').upload(filename, blob, { contentType: 'image/jpeg' });
      if (error) throw error;
      const { data } = supabase.storage.from('images').getPublicUrl(filename);
      urls.push(data.publicUrl);
    }
    return urls;
  }

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
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id!;

      const image_urls = photoUris.length > 0 ? await uploadPhotos(userId) : [];

      if (mode === 'text') {
        await api.entries.create({ input_type: 'text', raw_text: text, image_urls });
      } else {
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
          image_urls,
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
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {showPaywall && (
        <Paywall
          feature="photos"
          plan={plan}
          onUpgrade={() => { setShowPaywall(false); router.push('/(tabs)/profile'); }}
          onDismiss={() => setShowPaywall(false)}
        />
      )}

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
            <RecordButton status={status} onStart={startRecording} onStop={stopRecording} />
            {recError ? <Text style={styles.error}>{recError}</Text> : null}
            {audioUri ? (
              <Text style={styles.recorded}>Recorded {duration}s — ready to save</Text>
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

        {/* Photo strip — visible in both modes */}
        <View style={styles.photoSection}>
          <View style={styles.photoHeader}>
            <Text style={styles.photoLabel}>
              Photos {plan !== 'premium' ? '🔒' : ''}
            </Text>
            {plan !== 'premium' && (
              <Text style={styles.photoPremiumHint}>Premium feature</Text>
            )}
          </View>
          <PhotoStrip
            uris={photoUris}
            onRemove={removePhoto}
            onAdd={pickPhoto}
            maxPhotos={MAX_PHOTOS}
          />
        </View>

        <TouchableOpacity
          testID="save-entry-button"
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Entry</Text>}
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
  modeBtnActive:     { backgroundColor: '#6c63ff', borderColor: '#6c63ff' },
  modeBtnText:       { color: '#888', fontSize: 15, fontWeight: '500' },
  modeBtnTextActive: { color: '#fff' },
  voiceArea:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  hint:       { color: '#555', marginTop: 16, fontSize: 14 },
  recorded:   { color: '#6c63ff', marginTop: 16, fontSize: 14 },
  error:      { color: '#ff6b6b', marginTop: 8, fontSize: 14 },
  textInput: {
    flex: 1, minHeight: 200, backgroundColor: '#1e1e2e', borderRadius: 12, padding: 16,
    color: '#fff', fontSize: 16, lineHeight: 26, borderWidth: 1, borderColor: '#2a2a3e',
    marginBottom: 24,
  },
  photoSection: { marginBottom: 24 },
  photoHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  photoLabel:   { fontSize: 13, color: '#888', fontWeight: '500', flex: 1 },
  photoPremiumHint: { fontSize: 11, color: '#555' },
  saveBtn: {
    backgroundColor: '#6c63ff', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
