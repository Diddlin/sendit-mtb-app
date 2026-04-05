import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || '/api';

const LENGTH_OPTIONS = [
  { value: 'short',  label: 'Short',  sub: '< 8 mi' },
  { value: 'medium', label: 'Medium', sub: '6–14 mi' },
  { value: 'long',   label: 'Long',   sub: '10+ mi' },
];

const SEND_OPTIONS = [
  { value: 'low',  label: 'Low Key', emoji: '🌊', sub: 'Chill flow' },
  { value: 'mid',  label: 'Mid',     emoji: '🔥', sub: 'Some spice' },
  { value: 'big',  label: 'Big Send',emoji: '💀', sub: 'Send it!' },
];

export default function SearchPanel({ onResults, onLoading, onError }) {
  const { user } = useAuth();

  const [location,   setLocation]   = useState(user?.preferences?.defaultLocation || '');
  const [length,     setLength]     = useState(user?.preferences?.defaultLength || 'medium');
  const [sendLevel,  setSendLevel]  = useState(user?.preferences?.defaultSendLevel || 'mid');
  const [loading,    setLoading]    = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!location.trim()) {
      onError('Enter a location — zip code or city name');
      return;
    }

    setLoading(true);
    onLoading(true);
    onError(null);

    try {
      const { data } = await axios.get(`${API}/trails/search`, {
        params: { location: location.trim(), length, send_level: sendLevel, radius: 25 }
      });
      onResults(data);
    } catch (err) {
      const msg = err.response?.data?.error || 'Search failed. Check your location and try again.';
      onError(msg);
      onResults({ trails: [] });
    } finally {
      setLoading(false);
      onLoading(false);
    }
  }

  return (
    <div className="search-panel">
      <div className="search-panel-title">🏔 Find Your Ride</div>
      <form onSubmit={handleSearch}>
        <div className="search-grid">

          {/* Location */}
          <div className="field-group">
            <label className="field-label">📍 Location</label>
            <input
              className="field-input"
              type="text"
              placeholder="Moab, UT or 84532"
              value={location}
              onChange={e => setLocation(e.target.value)}
              aria-label="Location (zip code or city)"
            />
          </div>

          {/* Length */}
          <div className="field-group">
            <label className="field-label">📏 Length</label>
            <div className="toggle-group">
              {LENGTH_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`toggle-btn ${length === opt.value ? 'active' : ''}`}
                  onClick={() => setLength(opt.value)}
                  title={opt.sub}
                >
                  {opt.label}
                  <span style={{ display: 'block', fontSize: '10px', opacity: 0.75, marginTop: '2px' }}>{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Send Level */}
          <div className="field-group">
            <label className="field-label">💥 Send Level</label>
            <div className="toggle-group">
              {SEND_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`toggle-btn ${sendLevel === opt.value ? 'active' : ''}`}
                  onClick={() => setSendLevel(opt.value)}
                  title={opt.sub}
                >
                  {opt.emoji} {opt.label}
                  <span style={{ display: 'block', fontSize: '10px', opacity: 0.75, marginTop: '2px' }}>{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stoke Level — always HIGH */}
          <div className="field-group">
            <label className="field-label">⚡ Stoke Level</label>
            <div className="stoke-bar">
              🤙 ALWAYS HIGH
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="search-go-btn"
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : '🔍'}
            {loading ? 'Finding rides...' : 'Find Trails'}
          </button>
        </div>
      </form>
    </div>
  );
}
