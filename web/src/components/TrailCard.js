import React from 'react';
import { useAuth } from '../context/AuthContext';

function difficultyTag(difficulty) {
  const d = (difficulty || '').toLowerCase();
  if (d.includes('pro') || d.includes('proline')) return 'tag-proline';
  if (d.includes('double')) return 'tag-dblack';
  if (d.includes('black')) return 'tag-black';
  if (d.includes('blue')) return 'tag-blue';
  if (d.includes('green') || d.includes('easy')) return 'tag-green';
  return 'tag-green';
}

function sourceEmoji(source) {
  const map = {
    'TrailForks':    '🏔',
    'AllTrails':     '🥾',
    'Singletracks':  '🚵',
    'OpenStreetMap': '🗺',
  };
  return map[source] || '📍';
}

function renderStars(rating) {
  const full = Math.round(rating || 0);
  return '★'.repeat(Math.min(full, 5)) + '☆'.repeat(Math.max(0, 5 - full));
}

export default function TrailCard({ trail, onSelect, style }) {
  const { user, toggleFavorite } = useAuth();
  const isFav = user?.favorites?.some(f => f.id === trail.id);

  function handleFav(e) {
    e.stopPropagation();
    if (!user) return;
    toggleFavorite(trail);
  }

  function openMaps(e) {
    e.stopPropagation();
    window.open(trail.googleMapsUrl, '_blank', 'noopener');
  }

  return (
    <div
      className="trail-card fade-in"
      style={style}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onSelect()}
      aria-label={`View details for ${trail.name}`}
    >
      {trail.thumbnailUrl ? (
        <img
          className="trail-card-img"
          src={trail.thumbnailUrl}
          alt={trail.name}
          loading="lazy"
          onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
        />
      ) : null}
      <div
        className="trail-card-img-placeholder"
        style={{ display: trail.thumbnailUrl ? 'none' : 'flex' }}
      >
        🏔
      </div>

      <div className="trail-card-body">
        <div className="trail-card-top">
          <div className="trail-card-name">{trail.name}</div>
          {user && (
            <button
              className={`fav-btn ${isFav ? 'active' : ''}`}
              onClick={handleFav}
              title={isFav ? 'Remove from saved' : 'Save trail'}
              aria-label={isFav ? 'Unsave trail' : 'Save trail'}
            >
              {isFav ? '❤️' : '🤍'}
            </button>
          )}
        </div>

        <div className="trail-tags">
          <span className={`tag ${difficultyTag(trail.difficulty)}`}>{trail.difficulty}</span>
          <span className="tag tag-source">{sourceEmoji(trail.source)} {trail.source}</span>
        </div>

        <div className="trail-stats">
          <div className="trail-stat">
            <div className="trail-stat-label">Length</div>
            <div className="trail-stat-value">{trail.lengthMi ? `${trail.lengthMi} mi` : '—'}</div>
          </div>
          <div className="trail-stat">
            <div className="trail-stat-label">Rating</div>
            <div className="trail-stat-value">
              {trail.rating ? <span className="rating-stars">{renderStars(trail.rating)}</span> : <span style={{color:'var(--text-dim)'}}>—</span>}
            </div>
          </div>
          <div className="trail-stat">
            <div className="trail-stat-label">Reviews</div>
            <div className="trail-stat-value">{trail.numReviews > 0 ? trail.numReviews.toLocaleString() : '—'}</div>
          </div>
        </div>
      </div>

      <div className="trail-card-footer">
        <button className="card-btn" onClick={openMaps} title="Open in Google Maps">
          🗺 Maps
        </button>
        <button className="card-btn card-btn-accent" onClick={onSelect}>
          View Trail →
        </button>
      </div>
    </div>
  );
}
