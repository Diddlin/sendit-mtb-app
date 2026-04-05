import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const AuthContext = createContext(null);
const API = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync('token').then(token => {
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        axios.get(`${API}/user/me`)
          .then(r => setUser(r.data))
          .catch(() => { SecureStore.deleteItemAsync('token'); delete axios.defaults.headers.common['Authorization']; })
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
  }, []);

  async function login(email, password) {
    const { data } = await axios.post(`${API}/auth/login`, { email, password });
    await SecureStore.setItemAsync('token', data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(data.user);
    return data.user;
  }

  async function register(name, email, password) {
    const { data } = await axios.post(`${API}/auth/register`, { name, email, password });
    await SecureStore.setItemAsync('token', data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    await SecureStore.deleteItemAsync('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  }

  async function toggleFavorite(trail) {
    if (!user) return;
    const isFav = user.favorites?.some(f => f.id === trail.id);
    if (isFav) {
      await axios.delete(`${API}/user/favorites/${trail.id}`);
      setUser(u => ({ ...u, favorites: u.favorites.filter(f => f.id !== trail.id) }));
    } else {
      const { data } = await axios.post(`${API}/user/favorites`, {
        trailId: trail.id,
        trailData: { name: trail.name, source: trail.source, difficulty: trail.difficulty, lengthMi: trail.lengthMi }
      });
      setUser(u => ({ ...u, favorites: data.favorites }));
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, toggleFavorite }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
