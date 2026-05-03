import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Plan } from '@memoir/shared';

const FEATURE_LABELS: Record<string, string> = {
  photos: 'Attach photos to entries',
  chapterWriting: 'AI chapter writing',
  semanticSearch: 'Semantic memory search',
  monthlyDigest: 'Monthly deep digest',
  pdfExport: 'PDF export',
  shareCards: 'Share cards',
};

interface Props {
  feature: string;
  plan: Plan;
  onUpgrade: () => void;
  onDismiss: () => void;
}

export function Paywall({ feature, plan, onUpgrade, onDismiss }: Props) {
  if (plan === 'premium') return null;

  return (
    <View testID="paywall-screen" style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.lock}>🔒</Text>
        <Text style={styles.title}>Upgrade to Premium</Text>
        <Text style={styles.subtitle}>
          {FEATURE_LABELS[feature] ?? feature} is a Premium feature.
        </Text>

        <View style={styles.features}>
          {Object.values(FEATURE_LABELS).map((label) => (
            <Text key={label} style={styles.featureItem}>✓ {label}</Text>
          ))}
        </View>

        <TouchableOpacity style={styles.upgradeBtn} onPress={onUpgrade}>
          <Text style={styles.upgradeBtnText}>Start 14-day Free Trial</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
          <Text style={styles.dismissBtnText}>Maybe later</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  card: { backgroundColor: '#1e1e2e', borderRadius: 20, padding: 28, width: '88%', borderWidth: 1, borderColor: '#2a2a3e' },
  lock: { fontSize: 40, textAlign: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#888', textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  features: { gap: 8, marginBottom: 24 },
  featureItem: { color: '#aaa', fontSize: 14 },
  upgradeBtn: { backgroundColor: '#6c63ff', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 10 },
  upgradeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  dismissBtn: { alignItems: 'center', padding: 8 },
  dismissBtnText: { color: '#555', fontSize: 14 },
});
