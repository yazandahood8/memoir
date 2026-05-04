import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Share, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Paywall } from '@/components/Paywall';
import type { ChapterStyle, Plan } from '@memoir/shared';

const STYLES: { key: ChapterStyle; label: string; desc: string }[] = [
  { key: 'warm',      label: 'Warm',      desc: 'Personal & heartfelt' },
  { key: 'formal',    label: 'Formal',    desc: 'Polished & precise' },
  { key: 'narrative', label: 'Narrative', desc: 'Vivid & storytelling' },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function ChapterScreen() {
  const { id: collectionId, plan: planParam } = useLocalSearchParams<{ id: string; plan?: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const plan: Plan = (planParam as Plan) ?? 'free';

  const [selectedStyle, setSelectedStyle] = useState<ChapterStyle>('warm');
  const [showPaywall, setShowPaywall] = useState(false);

  const { data: chapter, isLoading, error } = useQuery({
    queryKey: ['chapter', collectionId],
    queryFn: () => api.chapters.get(collectionId),
    retry: false,
    refetchInterval: (query) => {
      // Poll every 5s while chapter is not yet generated
      return query.state.data ? false : 5000;
    },
  });

  const regenerate = useMutation({
    mutationFn: (style: ChapterStyle) => api.chapters.regenerate(chapter!.id, style),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapter', collectionId] });
      Alert.alert('Queued', 'Your chapter is being rewritten. Check back in a moment.');
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  function handleRegenerate() {
    if (plan !== 'premium') { setShowPaywall(true); return; }
    Alert.alert(
      'Regenerate Chapter',
      `Rewrite this chapter in "${selectedStyle}" style?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Rewrite', onPress: () => regenerate.mutate(selectedStyle) },
      ]
    );
  }

  async function handleShare() {
    if (!chapter) return;
    await Share.share({ message: chapter.content, title: 'My Memoir Chapter' });
  }

  // ── Loading / pending ───────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color="#6c63ff" size="large" />
        <Text style={styles.loadingText}>Loading your chapter…</Text>
      </View>
    );
  }

  if (error || !chapter) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.generatingIcon}>✨</Text>
        <Text style={styles.generatingTitle}>Your chapter is being written</Text>
        <Text style={styles.generatingSubtitle}>
          Claude is reading your entries and crafting your story.{'\n'}This usually takes under a minute.
        </Text>
        <ActivityIndicator color="#6c63ff" style={{ marginTop: 24 }} />
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>← Back to collection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Chapter ready ───────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {showPaywall && (
        <Paywall
          feature="chapterWriting"
          plan={plan}
          onUpgrade={() => { setShowPaywall(false); router.push('/(tabs)/profile'); }}
          onDismiss={() => setShowPaywall(false)}
        />
      )}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Meta */}
        <View style={styles.meta}>
          <Text style={styles.metaDate}>Generated {formatDate(chapter.generated_at)}</Text>
          {chapter.word_count && (
            <Text style={styles.metaWords}>{chapter.word_count.toLocaleString()} words</Text>
          )}
        </View>

        {/* Chapter prose */}
        <Text style={styles.prose}>{chapter.content}</Text>

        {/* Style selector */}
        <View style={styles.styleSection}>
          <Text style={styles.sectionLabel}>Writing style</Text>
          <View style={styles.stylePills}>
            {STYLES.map((s) => (
              <TouchableOpacity
                key={s.key}
                style={[styles.stylePill, selectedStyle === s.key && styles.stylePillActive]}
                onPress={() => setSelectedStyle(s.key)}
              >
                <Text style={[styles.stylePillText, selectedStyle === s.key && styles.stylePillTextActive]}>
                  {s.label}
                </Text>
                <Text style={[styles.stylePillDesc, selectedStyle === s.key && styles.stylePillDescActive]}>
                  {s.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            testID="regenerate-button"
            style={[styles.regenBtn, regenerate.isPending && styles.btnDisabled]}
            onPress={handleRegenerate}
            disabled={regenerate.isPending}
          >
            {regenerate.isPending
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.regenBtnText}>
                  {plan !== 'premium' ? '🔒 ' : ''}Rewrite in {STYLES.find(s=>s.key===selectedStyle)?.label} style
                </Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareBtnText}>Share chapter</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const PURPLE = '#6c63ff';
const BG     = '#0f0f1a';
const SURFACE = '#1e1e2e';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  centered:  { justifyContent: 'center', alignItems: 'center', padding: 32 },

  // loading / generating
  loadingText:        { color: '#888', marginTop: 14, fontSize: 14 },
  generatingIcon:     { fontSize: 48, marginBottom: 16 },
  generatingTitle:    { fontSize: 20, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 10 },
  generatingSubtitle: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22 },
  backLink:           { marginTop: 32 },
  backLinkText:       { color: PURPLE, fontSize: 14 },

  // scroll
  scroll: { paddingHorizontal: 24, paddingTop: 16 },

  // meta
  meta:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  metaDate:  { fontSize: 12, color: '#555' },
  metaWords: { fontSize: 12, color: '#555' },

  // prose — literary feel with generous line-height
  prose: {
    fontSize: 17,
    lineHeight: 30,
    color: '#ddd',
    letterSpacing: 0.2,
    marginBottom: 40,
  },

  // style section
  styleSection:  { marginBottom: 20 },
  sectionLabel:  { fontSize: 11, fontWeight: '600', color: '#555', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  stylePills:    { flexDirection: 'row', gap: 8 },
  stylePill:     { flex: 1, padding: 10, borderRadius: 10, backgroundColor: SURFACE, borderWidth: 1, borderColor: '#2a2a3e', alignItems: 'center' },
  stylePillActive: { borderColor: PURPLE, backgroundColor: 'rgba(108,99,255,0.12)' },
  stylePillText:  { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 2 },
  stylePillTextActive: { color: '#fff' },
  stylePillDesc:  { fontSize: 10, color: '#444', textAlign: 'center' },
  stylePillDescActive: { color: '#9990ff' },

  // actions
  actions:    { gap: 10, marginTop: 8 },
  regenBtn:   { backgroundColor: PURPLE, borderRadius: 12, padding: 15, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  regenBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  shareBtn:   { backgroundColor: SURFACE, borderRadius: 12, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a3e' },
  shareBtnText: { color: '#aaa', fontWeight: '600', fontSize: 15 },
});
