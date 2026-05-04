import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';

export default function ProfileScreen() {
  const router = useRouter();

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      {session?.user && (
        <View style={styles.accountCard}>
          <Text style={styles.accountLabel}>Signed in as</Text>
          <Text style={styles.accountEmail}>{session.user.email}</Text>
        </View>
      )}

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
              style={styles.digestPreview}
              onPress={() => router.push('/digests')}
            >
              <View>
                <Text style={styles.digestPreviewLabel}>
                  {digests[0].type === 'monthly' ? 'Monthly' : 'Weekly'} digest
                </Text>
                <Text style={styles.digestPreviewDate}>
                  {new Date(digests[0].period_end).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric',
                  })}
                </Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
            {digests.length > 1 && (
              <TouchableOpacity style={styles.allDigestsBtn} onPress={() => router.push('/digests')}>
                <Text style={styles.allDigestsBtnText}>View all {digests.length} digests →</Text>
              </TouchableOpacity>
            )}
          </>
        ) : !digestsLoading ? (
          <View style={styles.digestEmpty}>
            <Text style={styles.digestEmptyText}>
              Weekly digests appear here every Friday after you start journalling.
            </Text>
          </View>
        ) : null}
      </View>

      <TouchableOpacity
        testID="logout-button"
        style={styles.logoutBtn}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', padding: 24 },
  title: { fontSize: 28, fontWeight: '600', color: '#fff', marginBottom: 24 },
  accountCard: {
    backgroundColor: '#1e1e2e', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#2a2a3e', marginBottom: 24,
  },
  accountLabel: { fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  accountEmail: { fontSize: 15, color: '#fff', fontWeight: '500' },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: 0.8 },
  digestPreview: {
    backgroundColor: '#1e1e2e', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#2a2a3e', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between', marginBottom: 8,
  },
  digestPreviewLabel: { fontSize: 14, color: '#fff', fontWeight: '500', marginBottom: 2 },
  digestPreviewDate: { fontSize: 12, color: '#555' },
  arrow: { color: '#6c63ff', fontSize: 18 },
  allDigestsBtn: { paddingVertical: 8 },
  allDigestsBtnText: { color: '#6c63ff', fontSize: 13, fontWeight: '500' },
  digestEmpty: {
    backgroundColor: '#1e1e2e', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#2a2a3e',
  },
  digestEmptyText: { color: '#555', fontSize: 13, lineHeight: 20 },
  logoutBtn: {
    backgroundColor: '#1e1e2e', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#ff6b6b', alignItems: 'center', marginTop: 'auto',
  },
  logoutText: { color: '#ff6b6b', fontSize: 16, fontWeight: '600' },
});
