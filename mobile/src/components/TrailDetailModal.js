import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Modal, Linking, ActivityIndicator, Alert
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
const C = { bg:'#0d0f14', surface:'#161b27', surface2:'#1e2535', border:'#2a3347', accent:'#ff6b35', text:'#e8edf5', muted:'#7a8699', dim:'#4a5568', green:'#27ae60' };

function renderStars(r) {
  const n = Math.round(r || 0);
  return '★'.repeat(Math.min(n,5)) + '☆'.repeat(Math.max(0, 5-n));
}

export default function TrailDetailModal({ trail, onClose }) {
  const { user, toggleFavorite } = useAuth();
  const [garminStatus, setGarminStatus] = useState(null);
  const isFav = user?.favorites?.some(f => f.id === trail.id);

  async function handleGarminSend() {
    if (!user) { Alert.alert('Sign in required', 'Create an account to send courses to Garmin'); return; }
    setGarminStatus('sending');
    try {
      const { data } = await axios.post(`${API}/garmin/upload-course`, { trailName: trail.name, gpxUrl: trail.gpxUrl });
      setGarminStatus('success');
      Alert.alert('Sent! 🤙', data.message);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to send to Garmin';
      setGarminStatus('error');
      if (err.response?.data?.action) {
        Alert.alert('Garmin not connected', 'Connect your Garmin account in the Profile tab first.');
      } else {
        Alert.alert('Garmin error', msg);
      }
    }
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.headerTitle} numberOfLines={1}>{trail.name}</Text>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Text style={s.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.body}>
          {/* Meta grid */}
          <View style={s.metaGrid}>
            {[
              { label: 'DIFFICULTY', value: trail.difficulty },
              { label: 'LENGTH', value: `${trail.lengthMi} mi` },
              { label: 'RATING', value: `${renderStars(trail.rating)} ${trail.rating || ''}`, gold: true },
              { label: 'REVIEWS', value: (trail.numReviews||0).toLocaleString() },
              { label: 'SOURCE', value: trail.source },
              { label: 'LOCATION', value: trail.location || '—' },
            ].map(item => (
              <View key={item.label} style={s.metaItem}>
                <Text style={s.metaLabel}>{item.label}</Text>
                <Text style={[s.metaValue, item.gold && { color: '#f1c40f' }]}>{item.value}</Text>
              </View>
            ))}
          </View>

          {/* Description */}
          {trail.description ? (
            <View style={s.descSection}>
              <Text style={s.descText}>{trail.description}</Text>
            </View>
          ) : null}

          {/* Actions */}
          <View style={s.actionsGrid}>
            <TouchableOpacity style={s.btn} onPress={() => Linking.openURL(trail.trailUrl)}>
              <Text style={s.btnText}>{trail.source === 'TrailForks' ? '🏔' : '🥾'} View on {trail.source}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btn, s.btnAccent]} onPress={() => Linking.openURL(trail.googleMapsUrl)}>
              <Text style={[s.btnText, { color: '#fff' }]}>🗺 Google Maps</Text>
            </TouchableOpacity>
            {trail.gpxUrl && (
              <TouchableOpacity style={s.btn} onPress={() => Linking.openURL(trail.gpxUrl)}>
                <Text style={s.btnText}>📥 Download GPX</Text>
              </TouchableOpacity>
            )}
            {user && (
              <TouchableOpacity style={s.btn} onPress={() => toggleFavorite(trail)}>
                <Text style={s.btnText}>{isFav ? '❤️ Saved' : '🤍 Save Trail'}</Text>
              </TouchableOpacity>
            )}
            {trail.gpxUrl && (
              <TouchableOpacity
                style={[s.btn, s.btnGarmin, { gridColumn: 'span 2' }]}
                onPress={handleGarminSend}
                disabled={garminStatus === 'sending'}
              >
                {garminStatus === 'sending'
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={[s.btnText, { color: '#fff' }]}>⌚ Send to Garmin Connect</Text>
                }
              </TouchableOpacity>
            )}
          </View>

          {/* Manual Garmin import steps */}
          <View style={s.garminCard}>
            <Text style={s.garminTitle}>⌚ Manual Garmin Import</Text>
            {[
              'Download the GPX file above',
              'Go to connect.garmin.com and sign in',
              'Training → Courses → Import',
              'Select your GPX file',
              'Wait for upload, then sync your device 🤙'
            ].map((step, i) => (
              <View key={i} style={s.step}>
                <View style={s.stepBadge}><Text style={s.stepBadgeText}>{i+1}</Text></View>
                <Text style={s.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.text, flex: 1, marginRight: 12 },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: C.muted, fontSize: 16 },
  body: { padding: 16, paddingBottom: 40 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  metaItem: { backgroundColor: C.surface, borderRadius: 8, borderWidth: 1, borderColor: C.border, padding: 12, minWidth: '28%', flex: 1, alignItems: 'center' },
  metaLabel: { fontSize: 10, fontWeight: '700', color: C.dim, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  metaValue: { fontSize: 14, fontWeight: '700', color: C.text, textAlign: 'center' },
  descSection: { backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 16 },
  descText: { fontSize: 14, color: C.muted, lineHeight: 22 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  btn: { flex: 1, minWidth: '45%', backgroundColor: C.surface, borderRadius: 8, borderWidth: 1, borderColor: C.border, padding: 13, alignItems: 'center' },
  btnAccent: { backgroundColor: C.accent, borderColor: C.accent },
  btnGarmin: { backgroundColor: '#1b4b9a', borderColor: '#1b4b9a', width: '100%', flex: undefined },
  btnText: { color: C.muted, fontSize: 13, fontWeight: '600' },
  garminCard: { backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 14 },
  garminTitle: { fontSize: 12, fontWeight: '700', color: C.accent, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  stepBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  stepBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  stepText: { fontSize: 13, color: C.muted, flex: 1, lineHeight: 19 },
});
