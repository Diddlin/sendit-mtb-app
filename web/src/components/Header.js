import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Header({ onAuthClick, onFavoritesClick }) {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-inner">
        <a href="/" className="logo">
          <span className="logo-icon">🚵</span>
          <span className="logo-text">Send<span>It</span></span>
        </a>

        <div className="header-actions">
          {user ? (
            <>
              <button className="btn-ghost" onClick={onFavoritesClick}>
                ❤️ Saved ({user.favorites?.length || 0})
              </button>
              <div className="user-badge">
                <div className="user-avatar">{user.name?.[0]?.toUpperCase() || '?'}</div>
                {user.name?.split(' ')[0]}
              </div>
              <button className="btn-ghost" onClick={logout}>Sign out</button>
            </>
          ) : (
            <>
              <button className="btn-ghost" onClick={onAuthClick}>Sign in</button>
              <button className="btn-primary" onClick={onAuthClick}>Get Started</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
