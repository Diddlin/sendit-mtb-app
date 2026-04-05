import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import SearchPanel from './components/SearchPanel';
import TrailResults from './components/TrailResults';
import TrailModal from './components/TrailModal';
import AuthModal from './components/AuthModal';
import FavoritesPanel from './components/FavoritesPanel';
import './styles/app.css';

export default function App() {
  const [trails, setTrails]           = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [searchMeta, setSearchMeta]   = useState(null);
  const [selectedTrail, setSelectedTrail] = useState(null);
  const [showAuth, setShowAuth]       = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  function handleResults(data) {
    setTrails(data.trails || []);
    setSearchMeta(data);
    setHasSearched(true);
    setError(null);
  }

  return (
    <AuthProvider>
      <div className="app">
        <Header
          onAuthClick={() => setShowAuth(true)}
          onFavoritesClick={() => setShowFavorites(true)}
        />

        <main className="main">
          <SearchPanel
            onResults={handleResults}
            onLoading={setLoading}
            onError={setError}
          />

          {error && (
            <div className="error-banner fade-in">
              <span>⚠️</span> {error}
            </div>
          )}

          <TrailResults
            trails={trails}
            loading={loading}
            hasSearched={hasSearched}
            searchMeta={searchMeta}
            onSelectTrail={setSelectedTrail}
          />
        </main>

        {selectedTrail && (
          <TrailModal
            trail={selectedTrail}
            onClose={() => setSelectedTrail(null)}
          />
        )}

        {showAuth && (
          <AuthModal onClose={() => setShowAuth(false)} />
        )}

        {showFavorites && (
          <FavoritesPanel
            onClose={() => setShowFavorites(false)}
            onSelectTrail={(t) => { setShowFavorites(false); setSelectedTrail(t); }}
          />
        )}
      </div>
    </AuthProvider>
  );
}
