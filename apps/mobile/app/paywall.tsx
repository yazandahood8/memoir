import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';

const FEATURES = [
  { icon: '📸', label: 'Up to 5 photos per entry' },
  { icon: '✍️', label: 'AI-written memoir chapters' },
  { icon: '🔍', label: 'Semantic memory search' },
  { icon: '📬', label: 'Monthly digest email' },
  { icon: '📄', label: 'PDF chapter export' },
  { icon: '🎨', label: 'Instagram share cards' },
  { icon: '🔄', label: 'Chapter regeneration styles' },
  { icon: '♾️', label: 'Unlimited collections' },
];

export default function PaywallScreen() {
  const router = useRouter();
  const [annual, setAnnual] = useState(false);

  const price = annual ? '$60/year' : '$7/month';
  const saving = annual ? 'Save 29%' : null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.close} onPress={() => router.back()}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        <Text style={styles.emoji}>✨</Text>
        <Text style={styles.title}>Unlock Memoir Premium</Text>
        <Text style={styles.subtitle}>
          Turn your journal entries into beautiful memoir chapters with AI.
        </Text>

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.label} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.toggle}>
          <Text style={[styles.toggleLabel, !annual && styles.toggleLabelActive]}>Monthly</Text>
          <Switch
            value={annual}
            onValueChange={setAnnual}
            trackColor={{ false: '#2a2a3e', true: '#6c63ff' }}
            thumbColor="#fff"
          />
          <Text style={[styles.toggleLabel, annual && styles.toggleLabelActive]}>Annual</Text>
          {saving && <View style={styles.savingBadge}><Text style={styles.savingText}>{saving}</Text></View>}
        </View>

        <Text style={styles.price}>{price}</Text>
        {annual && <Text style={styles.priceNote}>$5/month, billed annually</Text>}

        <TouchableOpacity testID="start-trial-button" style={styles.ctaBtn} onPress={() => router.back()}>
          <Text style={styles.ctaBtnText}>Start 14-day Free Trial</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.restoreBtn} onPress={() => {}}>
          <Text style={styles.restoreBtnText}>Restore Purchase</Text>
        </TouchableOpacity>

        <Text style={styles.legal}>
          No charge until your trial ends. Cancel anytime in App Store / Play Store settings.
        </Text>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  scroll: { padding: 24, alignItems: 'center' },
  close: { alignSelf: 'flex-end', padding: 4, marginBottom: 8 },
  closeText: { color: '#555', fontSize: 18 },
  emoji: { fontSize: 52, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  features: { width: '100%', marginBottom: 28, gap: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: { fontSize: 20, width: 28 },
  featureLabel: { fontSize: 15, color: '#ccc' },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  toggleLabel: { fontSize: 14, color: '#555' },
  toggleLabelActive: { color: '#fff', fontWeight: '600' },
  savingBadge: { backgroundColor: 'rgba(57,211,83,0.2)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  savingText: { color: '#39d353', fontSize: 11, fontWeight: '700' },
  price: { fontSize: 32, fontWeight: '700', color: '#fff', marginBottom: 4 },
  priceNote: { fontSize: 13, color: '#555', marginBottom: 12 },
  ctaBtn: {
    backgroundColor: '#6c63ff', borderRadius: 14, paddingVertical: 16,
    paddingHorizontal: 32, width: '100%', alignItems: 'center', marginTop: 12,
  },
  ctaBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  restoreBtn: { marginTop: 14, padding: 8 },
  restoreBtnText: { color: '#555', fontSize: 14 },
  legal: { fontSize: 11, color: '#444', textAlign: 'center', lineHeight: 18, marginTop: 12, paddingHorizontal: 16 },
});
