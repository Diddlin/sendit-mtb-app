import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API = process.env.REACT_APP_API_URL || '/api';

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get(`${API}/user/me`)
        .then(r => setUser(r.data))
        .catch(() => { localStorage.removeItem('token'); delete axios.defaults.headers.common['Authorization']; })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email, password) {
    const { data } = await axios.post(`${API}/auth/login`, { email, password });
    localStorage.setItem('token', data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(data.user);
    return data.user;
  }

  async function register(name, email, password) {
    const { data } = await axios.post(`${API}/auth/register`, { name, email, password });
    localStorage.setItem('token', data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    await axios.post(`${API}/auth/logout`).catch(() => {});
    localStorage.removeItem('token');
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

  async function savePreferences(prefs) {
    const { data } = await axios.patch(`${API}/user/preferences`, prefs);
    setUser(u => ({ ...u, preferences: data.preferences }));
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, toggleFavorite, savePreferences }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
