import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';

export default function ProfileScreen() {
  const router = useRouter();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['account-profile'],
    queryFn: api.account.profile,
  });

  const { data: digests, isLoading: digestsLoading } = useQuery({
    queryKey: ['digests'],
    queryFn: api.digests.list,
  });

  async function handleLogout() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => { await supabase.auth.signOut(); },
      },
    ]);
  }

  async function handleExport() {
    Alert.alert(
      'Export Your Data',
      'This will download all your entries, collections, and chapters as a JSON file.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            try {
              await api.account.export();
              Alert.alert('Done', 'Your data export has been prepared. Check your downloads.');
            } catch {
              Alert.alert('Error', 'Export failed. Please try again.');
            }
          },
        },
      ]
    );
  }

  async function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data after a 30-day grace period. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.account.delete();
              await supabase.auth.signOut();
            } catch {
              Alert.alert('Error', 'Failed to delete account. Please contact support.');
            }
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>

      {/* Account card */}
      {profileLoading ? (
        <ActivityIndicator color="#6c63ff" style={{ marginBottom: 24 }} />
      ) : profile ? (
        <View style={styles.accountCard}>
          <View style={styles.accountRow}>
            <View>
              <Text style={styles.accountLabel}>Signed in as</Text>
              <Text style={styles.accountEmail}>{profile.email}</Text>
            </View>
            <View style={[styles.planBadge, profile.plan === 'premium' && styles.planBadgePremium]}>
              <Text style={styles.planBadgeText}>{profile.plan === 'premium' ? '✨ Premium' : 'Free'}</Text>
            </View>
          </View>
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.stats.entries}</Text>
              <Text style={styles.statLabel}>entries</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.stats.collections}</Text>
              <Text style={styles.statLabel}>collections</Text>
            </View>
          </View>
          {profile.plan !== 'premium' && (
            <TouchableOpacity
              testID="upgrade-button"
              style={styles.upgradeBtn}
              onPress={() => router.push('/paywall')}
            >
              <Text style={styles.upgradeBtnText}>✨ Upgrade to Premium</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      {/* Digests section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Digests</Text>
          {digestsLoading && <ActivityIndicator size="small" color="#6c63ff" />}
        </View>
        {digests && digests.length > 0 ? (
          <>
            <TouchableOpacity
              testID="view-digests-button"
              style={styles.row}
              onPress={() => router.push('/digests')}
            >
              <View>
                <Text style={styles.rowTitle}>
                  {digests[0].type === 'monthly' ? 'Monthly' : 'Weekly'} digest
                </Text>
                <Text style={styles.rowSubtitle}>
                  {new Date(digests[0].period_end).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric',
                  })}
                </Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
            {digests.length > 1 && (
              <TouchableOpacity onPress={() => router.push('/digests')}>
                <Text style={styles.linkText}>View all {digests.length} digests →</Text>
              </TouchableOpacity>
            )}
          </>
        ) : !digestsLoading ? (
          <Text style={styles.emptyText}>Weekly digests appear here every Friday.</Text>
        ) : null}
      </View>

      {/* Privacy & Data */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy & Data</Text>
        <TouchableOpacity testID="export-data-button" style={styles.row} onPress={handleExport}>
          <Text style={styles.rowTitle}>Export my data</Text>
          <Text style={styles.arrow}>↓</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="delete-account-button"
          style={[styles.row, styles.rowDanger]}
          onPress={handleDeleteAccount}
        >
          <Text style={styles.rowTitleDanger}>Delete account</Text>
          <Text style={styles.arrowDanger}>→</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity testID="logout-button" style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  content: { padding: 24 },
  title: { fontSize: 28, fontWeight: '600', color: '#fff', marginBottom: 24 },

  accountCard: {
    backgroundColor: '#1e1e2e', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#2a2a3e', marginBottom: 24,
  },
  accountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  accountLabel: { fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  accountEmail: { fontSize: 15, color: '#fff', fontWeight: '500' },
  planBadge: { backgroundColor: '#2a2a3e', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  planBadgePremium: { backgroundColor: 'rgba(108,99,255,0.2)' },
  planBadgeText: { fontSize: 12, color: '#aaa', fontWeight: '600' },
  stats: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#fff' },
  statLabel: { fontSize: 11, color: '#555', marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: '#2a2a3e' },
  upgradeBtn: {
    backgroundColor: '#6c63ff', borderRadius: 10, padding: 12, alignItems: 'center',
  },
  upgradeBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  row: {
    backgroundColor: '#1e1e2e', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#2a2a3e', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between', marginBottom: 8,
  },
  rowDanger: { borderColor: '#3a1e1e' },
  rowTitle: { fontSize: 14, color: '#fff', fontWeight: '500' },
  rowSubtitle: { fontSize: 12, color: '#555', marginTop: 2 },
  rowTitleDanger: { fontSize: 14, color: '#ff6b6b', fontWeight: '500' },
  arrow: { color: '#6c63ff', fontSize: 16 },
  arrowDanger: { color: '#ff6b6b', fontSize: 16 },
  linkText: { color: '#6c63ff', fontSize: 13, fontWeight: '500', paddingVertical: 6 },
  emptyText: { fontSize: 13, color: '#555', lineHeight: 20 },

  logoutBtn: {
    backgroundColor: '#1e1e2e', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#ff6b6b', alignItems: 'center',
  },
  logoutText: { color: '#ff6b6b', fontSize: 16, fontWeight: '600' },
});
