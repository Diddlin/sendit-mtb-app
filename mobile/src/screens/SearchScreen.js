import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, Linking
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import TrailDetailModal from '../components/TrailDetailModal';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

const C = {
  bg:      '#0d0f14',
  surface: '#161b27',
  surface2:'#1e2535',
  border:  '#2a3347',
  accent:  '#ff6b35',
  text:    '#e8edf5',
  muted:   '#7a8699',
  dim:     '#4a5568',
  green:   '#27ae60',
  blue:    '#2980b9',
};

const LENGTH_OPTIONS = [
  { value: 'short',  label: 'Short',  sub: '< 8 mi' },
  { value: 'medium', label: 'Medium', sub: '6–14 mi' },
  { value: 'long',   label: 'Long',   sub: '10+ mi' },
];

const SEND_OPTIONS = [
  { value: 'low', label: '🌊 Low Key' },
  { value: 'mid', label: '🔥 Mid' },
  { value: 'big', label: '💀 Big Send' },
];

function difficultyColor(d) {
  const s = (d || '').toLowerCase();
  if (s.includes('pro')) return '#f39c12';
  if (s.includes('double')) return '#e74c3c';
  if (s.includes('black')) return '#bdc3c7';
  if (s.includes('blue')) return C.blue;
  return C.green;
}

function renderStars(r) {
  const n = Math.round(r || 0);
  return '★'.repeat(Math.min(n, 5)) + '☆'.repeat(Math.max(0, 5 - n));
}

export default function SearchScreen() {
  const { user, toggleFavorite } = useAuth();
  const [location,   setLocation]   = useState('');
  const [length,     setLength]     = useState('medium');
  const [sendLevel,  setSendLevel]  = useState('mid');
  const [trails,     setTrails]     = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [searchMeta, setSearchMeta] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selected, setSelected]     = useState(null);

  async function handleSearch() {
    if (!location.trim()) { Alert.alert('Location needed', 'Enter a city or zip code'); return; }
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/trails/search`, {
        params: { location: location.trim(), length, send_level: sendLevel, radius: 25 }
      });
      setTrails(data.trails || []);
      setSearchMeta(data);
      setHasSearched(true);
    } catch (err) {
      Alert.alert('Search failed', err.response?.data?.error || 'Check your location and try again');
    } finally {
      setLoading(false);
    }
  }

  const isFav = (trail) => user?.favorites?.some(f => f.id === trail.id);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

      {/* Search card */}
      <View style={s.card}>
        <Text style={s.cardLabel}>📍 LOCATION</Text>
        <TextInput
          style={s.input}
          placeholder="City, state or zip code"
          placeholderTextColor={C.dim}
          value={location}
          onChangeText={setLocation}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />

        <Text style={[s.cardLabel, { marginTop: 14 }]}>📏 LENGTH</Text>
        <View style={s.toggleRow}>
          {LENGTH_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[s.toggleBtn, length === opt.value && s.toggleBtnActive]}
              onPress={() => setLength(opt.value)}
            >
              <Text style={[s.toggleBtnText, length === opt.value && s.toggleBtnTextActive]}>
                {opt.label}
              </Text>
              <Text style={[s.toggleBtnSub, length === opt.value && { color: 'rgba(255,255,255,0.75)' }]}>
                {opt.sub}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[s.cardLabel, { marginTop: 14 }]}>💥 SEND LEVEL</Text>
        <View style={s.toggleRow}>
          {SEND_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[s.toggleBtn, sendLevel === opt.value && s.toggleBtnActive]}
              onPress={() => setSendLevel(opt.value)}
            >
              <Text style={[s.toggleBtnText, sendLevel === opt.value && s.toggleBtnTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.stokeBar}>
          <Text style={s.stokeText}>⚡ STOKE LEVEL: ALWAYS HIGH 🤙</Text>
        </View>

        <TouchableOpacity
          style={[s.searchBtn, loading && { opacity: 0.6 }]}
          onPress={handleSearch}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={s.searchBtnText}>🔍 Find Trails</Text>}
        </TouchableOpacity>
      </View>

      {/* Results */}
      {hasSearched && !loading && (
        <>
          <View style={s.resultsHeader}>
            <Text style={s.resultsTitle}>
              {searchMeta?.location?.label?.split(',').slice(0, 2).join(',') || 'Results'}
            </Text>
            <Text style={s.resultsCount}>{trails.length} trails</Text>
          </View>

          {trails.length === 0 && (
            <View style={s.emptyState}>
              <Text style={s.emptyIcon}>😤</Text>
              <Text style={s.emptyTitle}>No trails found</Text>
              <Text style={s.emptyText}>Try a different location or loosen the filters.</Text>
            </View>
          )}

          {trails.map(trail => (
            <TouchableOpacity
              key={trail.id}
              style={s.trailCard}
              onPress={() => setSelected(trail)}
              activeOpacity={0.85}
            >
              <View style={s.trailCardTop}>
                <Text style={s.trailName} numberOfLines={2}>{trail.name}</Text>
                {user && (
                  <TouchableOpacity onPress={() => toggleFavorite(trail)} style={{ padding: 4 }}>
                    <Text style={{ fontSize: 20 }}>{isFav(trail) ? '❤️' : '🤍'}</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={s.tagRow}>
                <View style={[s.tag, { borderColor: difficultyColor(trail.difficulty) }]}>
                  <Text style={[s.tagText, { color: difficultyColor(trail.difficulty) }]}>
                    {trail.difficulty}
                  </Text>
                </View>
                <View style={s.tag}>
                  <Text style={[s.tagText, { color: C.muted }]}>{trail.source}</Text>
                </View>
              </View>

              <View style={s.trailStats}>
                <View style={s.stat}>
                  <Text style={s.statLabel}>LENGTH</Text>
                  <Text style={s.statValue}>{trail.lengthMi} mi</Text>
                </View>
                <View style={s.stat}>
                  <Text style={s.statLabel}>RATING</Text>
                  <Text style={[s.statValue, { color: '#f1c40f' }]}>{renderStars(trail.rating)}</Text>
                </View>
                <View style={s.stat}>
                  <Text style={s.statLabel}>REVIEWS</Text>
                  <Text style={s.statValue}>{(trail.numReviews || 0).toLocaleString()}</Text>
                </View>
              </View>

              <View style={s.cardBtnRow}>
                <TouchableOpacity
                  style={s.cardBtn}
                  onPress={() => Linking.openURL(trail.googleMapsUrl)}
                >
                  <Text style={s.cardBtnText}>🗺 Maps</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.cardBtn, s.cardBtnAccent]}
                  onPress={() => setSelected(trail)}
                >
                  <Text style={[s.cardBtnText, { color: '#fff' }]}>View Trail →</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </>
      )}

      {!hasSearched && !loading && (
        <View style={s.emptyState}>
          <Text style={s.emptyIcon}>🏔</Text>
          <Text style={s.emptyTitle}>Find your next send</Text>
          <Text style={s.emptyText}>Enter your location and dial in your preferences above.</Text>
        </View>
      )}

      {selected && (
        <TrailDetailModal
          trail={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 18, marginBottom: 20 },
  cardLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: C.muted, marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 8, color: C.text, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15 },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: { flex: 1, paddingVertical: 9, paddingHorizontal: 6, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 8, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: C.accent, borderColor: C.accent },
  toggleBtnText: { color: C.muted, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  toggleBtnTextActive: { color: '#fff' },
  toggleBtnSub: { color: C.dim, fontSize: 10, marginTop: 2, textAlign: 'center' },
  stokeBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 11, marginTop: 14, marginBottom: 16 },
  stokeText: { color: C.accent, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  searchBtn: { backgroundColor: C.accent, borderRadius: 8, padding: 14, alignItems: 'center' },
  searchBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  resultsTitle: { fontSize: 16, fontWeight: '700', color: C.text, flex: 1 },
  resultsCount: { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, fontSize: 12, color: C.muted, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 22 },
  trailCard: { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, marginBottom: 14, overflow: 'hidden' },
  trailCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 14, paddingBottom: 10 },
  trailName: { fontSize: 15, fontWeight: '700', color: C.text, flex: 1, marginRight: 8 },
  tagRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, marginBottom: 12 },
  tag: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: 'transparent' },
  tagText: { fontSize: 11, fontWeight: '700' },
  trailStats: { flexDirection: 'row', paddingHorizontal: 14, gap: 20, marginBottom: 14 },
  stat: { gap: 2 },
  statLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: C.dim, textTransform: 'uppercase' },
  statValue: { fontSize: 14, fontWeight: '600', color: C.text },
  cardBtnRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 14 },
  cardBtn: { flex: 1, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  cardBtnAccent: { backgroundColor: C.accent, borderColor: C.accent },
  cardBtnText: { color: C.muted, fontSize: 13, fontWeight: '600' },
});
