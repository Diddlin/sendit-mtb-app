import React from 'react';
import TrailCard from './TrailCard';

function SkeletonCard() {
  return (
    <div className="trail-card-skeleton">
      <div className="skel-img skeleton" />
      <div className="skel-body">
        <div className="skel-line skel-title skeleton" />
        <div className="skel-line skel-short skeleton" />
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <div className="skel-line skeleton" style={{ width: 60, height: 22 }} />
          <div className="skel-line skeleton" style={{ width: 60, height: 22 }} />
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          <div className="skel-line skeleton" style={{ width: 70, height: 36 }} />
          <div className="skel-line skeleton" style={{ width: 70, height: 36 }} />
          <div className="skel-line skeleton" style={{ width: 70, height: 36 }} />
        </div>
      </div>
    </div>
  );
}

export default function TrailResults({ trails, loading, hasSearched, searchMeta, onSelectTrail }) {
  if (loading) {
    return (
      <>
        <div className="results-header">
          <div>
            <div className="skeleton" style={{ width: 180, height: 20 }} />
            <div className="skeleton" style={{ width: 140, height: 14, marginTop: 6 }} />
          </div>
        </div>
        <div className="trail-grid">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </>
    );
  }

  if (!hasSearched) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">🏔</span>
        <h2>Find your next send</h2>
        <p>Enter your location and dial in your ride preferences above. Stoke level is always high.</p>
      </div>
    );
  }

  if (trails.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">😤</span>
        <h2>No trails found</h2>
        <p>Try a different location or loosen up the filters. There's always somewhere to shred.</p>
      </div>
    );
  }

  const { location, filters } = searchMeta || {};
  const sendLabels = { low: 'Low Key 🌊', mid: 'Mid 🔥', big: 'Big Send 💀' };
  const lenLabels  = { short: 'Short (< 8mi)', medium: 'Medium (6–14mi)', long: 'Long (10+mi)' };

  return (
    <div className="fade-in">
      <div className="results-header">
        <div>
          <div className="results-title">
            Trails near {location?.label?.split(',').slice(0,2).join(',') || 'your location'}
          </div>
          {filters && (
            <div className="results-subtitle">
              {lenLabels[filters.length]} · {sendLabels[filters.send_level]} · within {filters.radius} miles
            </div>
          )}
        </div>
        <div className="results-count">{trails.length} trail{trails.length !== 1 ? 's' : ''}</div>
      </div>

      <div className="trail-grid">
        {trails.map((trail, i) => (
          <TrailCard
            key={trail.id}
            trail={trail}
            onSelect={() => onSelectTrail(trail)}
            style={{ animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
