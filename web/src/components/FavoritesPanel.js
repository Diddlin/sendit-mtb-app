import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function FavoritesPanel({ onClose, onSelectTrail }) {
  const { user, toggleFavorite } = useAuth();
  const favorites = user?.favorites || [];

  return (
    <div className="side-panel-overlay" onClick={onClose}>
      <div className="side-panel" onClick={e => e.stopPropagation()}>
        <div className="side-panel-header">
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>❤️ Saved Trails</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {favorites.length} saved
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="side-panel-body">
          {favorites.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🤍</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>No saved trails yet</div>
              <div style={{ fontSize: 13 }}>Tap the ❤️ on any trail card to save it here</div>
            </div>
          ) : (
            favorites.map(trail => (
              <div
                key={trail.id}
                className="fav-item"
                onClick={() => onSelectTrail(trail)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && onSelectTrail(trail)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="fav-item-name">{trail.name}</div>
                  <button
                    style={{ background: 'transparent', border: 'none', fontSize: 16, cursor: 'pointer', color: '#ff4757', padding: '0 0 0 8px' }}
                    onClick={e => { e.stopPropagation(); toggleFavorite(trail); }}
                    title="Remove"
                    aria-label="Remove from saved"
                  >
                    ✕
                  </button>
                </div>
                <div className="fav-item-meta">
                  <span>{trail.difficulty}</span>
                  <span>{trail.lengthMi} mi</span>
                  <span>{trail.source}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
                  Saved {new Date(trail.savedAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
