import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';

const C = { bg:'#0d0f14', surface:'#161b27', surface2:'#1e2535', border:'#2a3347', accent:'#ff6b35', text:'#e8edf5', muted:'#7a8699', dim:'#4a5568' };

export default function ProfileScreen() {
  const { user, login, register, logout } = useAuth();
  const [tab,      setTab]      = useState('login');
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleAuth() {
    if (!email || !password) { Alert.alert('Required', 'Fill in all fields'); return; }
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        if (!name) { Alert.alert('Required', 'Enter your name'); setLoading(false); return; }
        await register(name, email, password);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (user) {
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <View style={s.profileCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{user.name?.[0]?.toUpperCase() || '?'}</Text>
          </View>
          <Text style={s.profileName}>{user.name}</Text>
          <Text style={s.profileEmail}>{user.email}</Text>
        </View>

        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statNum}>{user.favorites?.length || 0}</Text>
            <Text style={s.statLbl}>Saved Trails</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statNum}>{user.garminConnected ? '✅' : '—'}</Text>
            <Text style={s.statLbl}>Garmin</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>⌚ GARMIN CONNECT</Text>
          {user.garminConnected ? (
            <Text style={s.connectedText}>✅ Connected — use "Send to Garmin" on any trail</Text>
          ) : (
            <Text style={s.mutedText}>
              Connect your Garmin account to push GPX courses directly to your device from the trail detail screen.
              {'\n\n'}Garmin OAuth requires a developer account at developer.garmin.com/health-api/
            </Text>
          )}
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>🏔 MANUAL GARMIN IMPORT</Text>
          {['Download the GPX file from any trail', 'Go to connect.garmin.com', 'Training → Courses → Import', 'Select your GPX file', 'Sync your device 🤙'].map((step, i) => (
            <View key={i} style={s.step}>
              <View style={s.stepNum}><Text style={s.stepNumText}>{i+1}</Text></View>
              <Text style={s.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={s.logoutBtn} onPress={logout}>
          <Text style={s.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <View style={s.authCard}>
        <Text style={s.authTitle}>🚵 {tab === 'login' ? 'Welcome Back' : 'Join SendIt'}</Text>
        <Text style={s.authSub}>Save trails, connect Garmin, and more</Text>

        <View style={s.tabs}>
          {['login', 'register'].map(t => (
            <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
              <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t === 'login' ? 'Sign In' : 'Create Account'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'register' && (
          <TextInput style={s.input} placeholder="Your name" placeholderTextColor={C.dim} value={name} onChangeText={setName} />
        )}
        <TextInput style={s.input} placeholder="Email" placeholderTextColor={C.dim} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={s.input} placeholder="Password" placeholderTextColor={C.dim} value={password} onChangeText={setPassword} secureTextEntry />

        <TouchableOpacity style={s.authBtn} onPress={handleAuth} disabled={loading}>
          <Text style={s.authBtnText}>{loading ? '...' : tab === 'login' ? 'Sign In 🤙' : 'Create Account 🚵'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 40 },
  profileCard: { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 24, alignItems: 'center', marginBottom: 16 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 30, fontWeight: '800', color: '#fff' },
  profileName: { fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 4 },
  profileEmail: { fontSize: 14, color: C.muted },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 16, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: 4 },
  statLbl: { fontSize: 11, color: C.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  section: { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: C.accent, letterSpacing: 1.2, marginBottom: 12, textTransform: 'uppercase' },
  connectedText: { fontSize: 14, color: '#5dbb7a' },
  mutedText: { fontSize: 13, color: C.muted, lineHeight: 20 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  stepNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  stepText: { fontSize: 13, color: C.muted, flex: 1 },
  logoutBtn: { backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 14, alignItems: 'center', marginTop: 8 },
  logoutText: { color: C.muted, fontSize: 14, fontWeight: '600' },
  authCard: { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 24, marginTop: 20 },
  authTitle: { fontSize: 22, fontWeight: '800', color: C.text, textAlign: 'center', marginBottom: 6 },
  authSub: { fontSize: 13, color: C.muted, textAlign: 'center', marginBottom: 20 },
  tabs: { flexDirection: 'row', borderRadius: 8, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 20 },
  tab: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: C.bg },
  tabActive: { backgroundColor: C.accent },
  tabText: { fontSize: 14, fontWeight: '600', color: C.muted },
  tabTextActive: { color: '#fff' },
  input: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 8, color: C.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 12 },
  authBtn: { backgroundColor: C.accent, borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 4 },
  authBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
