import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  async function handleLogout() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

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
  title: { fontSize: 28, fontWeight: '600', color: '#fff', marginBottom: 32 },
  logoutBtn: {
    backgroundColor: '#1e1e2e', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#ff6b6b', alignItems: 'center',
  },
  logoutText: { color: '#ff6b6b', fontSize: 16, fontWeight: '600' },
});
