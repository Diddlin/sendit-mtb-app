import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import TrailDetailModal from '../components/TrailDetailModal';

const C = { bg:'#0d0f14', surface:'#161b27', border:'#2a3347', accent:'#ff6b35', text:'#e8edf5', muted:'#7a8699', dim:'#4a5568' };

export default function FavoritesScreen() {
  const { user, toggleFavorite } = useAuth();
  const [selected, setSelected] = useState(null);
  const favorites = user?.favorites || [];

  if (!user) {
    return (
      <View style={s.center}>
        <Text style={s.bigIcon}>🤍</Text>
        <Text style={s.title}>Sign in to save trails</Text>
        <Text style={s.sub}>Create an account to keep track of your favorite rides</Text>
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <View style={s.center}>
        <Text style={s.bigIcon}>🤍</Text>
        <Text style={s.title}>No saved trails yet</Text>
        <Text style={s.sub}>Tap the ❤️ on any trail to save it here</Text>
      </View>
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.count}>{favorites.length} saved trail{favorites.length !== 1 ? 's' : ''}</Text>
      {favorites.map(trail => (
        <TouchableOpacity
          key={trail.id}
          style={s.item}
          onPress={() => setSelected(trail)}
          activeOpacity={0.85}
        >
          <View style={s.itemLeft}>
            <Text style={s.itemName} numberOfLines={1}>{trail.name}</Text>
            <Text style={s.itemMeta}>{trail.difficulty} · {trail.lengthMi} mi · {trail.source}</Text>
            <Text style={s.itemDate}>Saved {new Date(trail.savedAt).toLocaleDateString()}</Text>
          </View>
          <TouchableOpacity onPress={() => toggleFavorite(trail)} style={s.removeBtn}>
            <Text style={{ fontSize: 18 }}>❌</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}

      {selected && <TrailDetailModal trail={selected} onClose={() => setSelected(null)} />}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 30 },
  bigIcon: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 8, textAlign: 'center' },
  sub: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 22 },
  count: { fontSize: 13, color: C.muted, fontWeight: '600', marginBottom: 14 },
  item: { backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  itemLeft: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 4 },
  itemMeta: { fontSize: 13, color: C.muted, marginBottom: 2 },
  itemDate: { fontSize: 11, color: C.dim },
  removeBtn: { padding: 8, marginLeft: 8 },
});
