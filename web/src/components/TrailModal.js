import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || '/api';

export default function TrailModal({ trail, onClose }) {
  const { user, toggleFavorite } = useAuth();
  const [garminStatus, setGarminStatus] = useState(null); // 'sending' | 'success' | 'error' | null
  const [garminMsg, setGarminMsg]       = useState('');

  const isFav = user?.favorites?.some(f => f.id === trail.id);

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  async function handleGarminSend() {
    if (!user) {
      alert('Sign in to send courses to your Garmin!');
      return;
    }
    setGarminStatus('sending');
    setGarminMsg('');
    try {
      const { data } = await axios.post(`${API}/garmin/upload-course`, {
        trailName: trail.name,
        gpxUrl: trail.gpxUrl,
      });
      setGarminStatus('success');
      setGarminMsg(data.message);
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.action) {
        // Not connected to Garmin — redirect to connect
        setGarminStatus('connect');
        setGarminMsg(errData.action);
      } else {
        setGarminStatus('error');
        setGarminMsg(errData?.error || 'Failed to send to Garmin');
      }
    }
  }

  function renderStars(rating) {
    const full = Math.round(rating || 0);
    return '★'.repeat(Math.min(full, 5)) + '☆'.repeat(Math.max(0, 5 - full));
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={trail.name}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{trail.name}</div>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body">
          {/* Trail image */}
          {trail.thumbnailUrl ? (
            <img className="modal-img" src={trail.thumbnailUrl} alt={trail.name} />
          ) : (
            <div className="modal-img-placeholder">🏔</div>
          )}

          {/* Meta grid */}
          <div className="modal-meta">
            <div className="modal-meta-item">
              <div className="modal-meta-label">Difficulty</div>
              <div className="modal-meta-value" style={{ fontSize: 14 }}>{trail.difficulty}</div>
            </div>
            <div className="modal-meta-item">
              <div className="modal-meta-label">Length</div>
              <div className="modal-meta-value">{trail.lengthMi} mi</div>
            </div>
            <div className="modal-meta-item">
              <div className="modal-meta-label">Rating</div>
              <div className="modal-meta-value" style={{ color: trail.rating ? '#f1c40f' : 'var(--text-dim)', fontSize: 14 }}>
                {trail.rating ? `${renderStars(trail.rating)} ${trail.rating}` : 'No rating'}
              </div>
            </div>
            <div className="modal-meta-item">
              <div className="modal-meta-label">Reviews</div>
              <div className="modal-meta-value">{trail.numReviews > 0 ? trail.numReviews.toLocaleString() : '—'}</div>
            </div>
            <div className="modal-meta-item">
              <div className="modal-meta-label">Source</div>
              <div className="modal-meta-value" style={{ fontSize: 13 }}>{trail.source}</div>
            </div>
            {trail.location && (
              <div className="modal-meta-item">
                <div className="modal-meta-label">Area</div>
                <div className="modal-meta-value" style={{ fontSize: 12 }}>{trail.location}</div>
              </div>
            )}
          </div>

          {/* Description */}
          {trail.description && (
            <p className="modal-description">{trail.description}</p>
          )}

          {/* Action buttons */}
          <div className="modal-actions">
            <a
              href={trail.trailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="modal-btn"
            >
              {{'TrailForks':'🏔','AllTrails':'🥾','Singletracks':'🚵','OpenStreetMap':'🗺'}[trail.source] || '📍'} View on {trail.source}
            </a>

            <a
              href={trail.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="modal-btn modal-btn-accent"
            >
              🗺 Open in Google Maps
            </a>

            {trail.gpxUrl && (
              <a
                href={trail.gpxUrl}
                download
                className="modal-btn"
                title="Download GPX file"
              >
                📥 Download GPX
              </a>
            )}

            {user && (
              <button
                className={`modal-btn ${isFav ? '' : 'modal-btn-accent'}`}
                onClick={() => toggleFavorite(trail)}
              >
                {isFav ? '❤️ Saved' : '🤍 Save Trail'}
              </button>
            )}

            {/* Garmin button */}
            {trail.gpxUrl && (
              <button
                className="modal-btn modal-btn-garmin"
                onClick={handleGarminSend}
                disabled={garminStatus === 'sending'}
                style={{ gridColumn: 'span 2' }}
              >
                {garminStatus === 'sending' ? (
                  <><span className="spinner" style={{ borderTopColor: '#fff', width: 14, height: 14 }} /> Sending to Garmin...</>
                ) : (
                  <> ⌚ Send to Garmin Connect</>
                )}
              </button>
            )}
          </div>

          {/* Garmin status message */}
          {garminStatus === 'success' && (
            <div style={{ background: 'rgba(39,174,96,0.15)', border: '1px solid rgba(39,174,96,0.4)', borderRadius: 8, padding: '12px 16px', color: '#5dbb7a', fontSize: 14 }}>
              ✅ {garminMsg}
            </div>
          )}

          {garminStatus === 'error' && (
            <div style={{ background: 'rgba(139,0,0,0.2)', border: '1px solid rgba(220,50,50,0.4)', borderRadius: 8, padding: '12px 16px', color: '#ff8a8a', fontSize: 14 }}>
              ❌ {garminMsg}
            </div>
          )}

          {/* Manual Garmin import instructions */}
          <div className="garmin-steps">
            <h4>⌚ Import to Garmin manually</h4>
            <ol>
              <li>Download the GPX file above</li>
              <li>Go to <a href="https://connect.garmin.com" target="_blank" rel="noopener noreferrer">connect.garmin.com</a> and sign in</li>
              <li>Navigate to Training → Courses</li>
              <li>Click <strong>Import</strong> (top right)</li>
              <li>Select your downloaded GPX file</li>
              <li>Wait for upload to complete — then sync your device 🤙</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
