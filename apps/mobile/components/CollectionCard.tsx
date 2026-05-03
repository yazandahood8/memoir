import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Collection } from '@memoir/shared';

interface Props {
  collection: Collection;
  onPress: (id: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  active: '#f5c518',
  closed: '#6c63ff',
  archived: '#555',
};

export function CollectionCard({ collection, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(collection.id)} activeOpacity={0.8}>
      <View style={styles.header}>
        <Text style={styles.name}>{collection.name}</Text>
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[collection.status] + '33' }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLORS[collection.status] }]}>
            {collection.status}
          </Text>
        </View>
      </View>
      {collection.description ? (
        <Text style={styles.description} numberOfLines={2}>{collection.description}</Text>
      ) : null}
      <Text style={styles.date}>
        {new Date(collection.started_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        {collection.ended_at ? ` – ${new Date(collection.ended_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : ' – present'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#1e1e2e', borderRadius: 14, padding: 16, marginHorizontal: 16, marginVertical: 6, borderWidth: 1, borderColor: '#2a2a3e' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  name: { fontSize: 17, fontWeight: '600', color: '#fff', flex: 1, marginRight: 8 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  description: { color: '#888', fontSize: 14, lineHeight: 20, marginBottom: 8 },
  date: { color: '#555', fontSize: 12 },
});
