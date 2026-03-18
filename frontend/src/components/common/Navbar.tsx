import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { auth, theme, toggleTheme, logout } = useApp();
  const loc = useLocation();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const active = (p: string) => loc.pathname === p || loc.pathname.startsWith(p + '/');

  return (
    <nav className="nav">
      <div className="container nav-inner">
        {/* Logo */}
        <Link to="/" className="nav-logo">
          <span className="nav-logo-icon">🎟</span>
          <span>
            <span className="logo-mod">Snap</span>
            <span className="logo-ex">Book</span>
          </span>
        </Link>

        {/* Links */}
        <div className="nav-links">
          <Link to="/" className={`nav-link ${active('/') && loc.pathname === '/' ? 'on' : ''}`}>Shows</Link>
          {auth.isAuthenticated && auth.role === 'admin' && (
            <Link to="/admin" className={`nav-link ${active('/admin') ? 'on' : ''}`}>Admin</Link>
          )}
        </div>

        {/* Right */}
        <div className="nav-right">
          {/* Theme toggle — pill style */}
          <button
            className={`theme-pill ${theme}`}
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <span className="tp-track">
              <span className="tp-sun">☀</span>
              <span className="tp-moon">☽</span>
              <span className="tp-thumb" />
            </span>
          </button>

          {!auth.isAuthenticated ? (
            <button className="btn btn-primary btn-sm" onClick={() => nav('/login')}>Sign in</button>
          ) : (
            <div className="user-chip">
              <button className="chip-btn" onClick={() => setOpen(o => !o)}>
                <span className="chip-av">{auth.name[0]}</span>
                <span className="chip-name">{auth.name}</span>
                <span className={`chip-role role-${auth.role}`}>{auth.role}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
                  style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
                  <path strokeLinecap="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {open && (
                <div className="chip-dropdown">
                  {auth.role === 'admin' && (
                    <Link to="/admin" className="dd-item" onClick={() => setOpen(false)}>
                      ⚙ Dashboard
                    </Link>
                  )}
                  <button className="dd-item danger" onClick={() => { logout(); nav('/'); setOpen(false); }}>
                    ↪ Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
