import { View, Image, TouchableOpacity, Text, ScrollView, StyleSheet } from 'react-native';

interface Props {
  uris: string[];
  onRemove: (index: number) => void;
  onAdd: () => void;
  maxPhotos?: number;
}

export function PhotoStrip({ uris, onRemove, onAdd, maxPhotos = 5 }: Props) {
  return (
    <View style={styles.wrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
        {uris.map((uri, i) => (
          <View key={uri} style={styles.thumb}>
            <Image source={{ uri }} style={styles.img} />
            <TouchableOpacity style={styles.remove} onPress={() => onRemove(i)}>
              <Text style={styles.removeText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
        {uris.length < maxPhotos && (
          <TouchableOpacity testID="add-photo-button" style={styles.addBtn} onPress={onAdd}>
            <Text style={styles.addIcon}>+</Text>
            <Text style={styles.addText}>{uris.length}/{maxPhotos}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  strip:   { gap: 8, paddingVertical: 4 },
  thumb:   { width: 72, height: 72, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  img:     { width: '100%', height: '100%' },
  remove: {
    position: 'absolute', top: 3, right: 3,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
  removeText: { color: '#fff', fontSize: 14, lineHeight: 18 },
  addBtn: {
    width: 72, height: 72, borderRadius: 8,
    backgroundColor: '#1e1e2e', borderWidth: 1, borderColor: '#2a2a3e',
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  addIcon: { color: '#6c63ff', fontSize: 22 },
  addText: { color: '#555', fontSize: 10 },
});
