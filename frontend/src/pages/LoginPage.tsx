import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const { login } = useApp();
  const nav = useNavigate();
  const [role, setRole] = useState<UserRole>('user');

  const go = () => { login(role); nav(role === 'admin' ? '/admin' : '/'); };

  return (
    <div className="login-page">
      <div className="login-card card">
        <div className="login-logo">🎟 <span>Mod<b style={{color:'var(--accent)'}}>ex</b></span></div>
        <h1 className="login-title">Sign in to continue</h1>
        <p className="login-sub">Demo auth — choose a role to explore the platform</p>

        <div className="role-cards">
          {(['user','admin'] as UserRole[]).map(r => (
            <button
              key={r}
              className={`role-card ${role === r ? 'on' : ''}`}
              onClick={() => setRole(r)}
            >
              <span className="rc-icon">{r === 'admin' ? '⚙️' : '🧑'}</span>
              <div className="rc-info">
                <div className="rc-title">{r === 'admin' ? 'Administrator' : 'Guest User'}</div>
                <div className="rc-desc">{r === 'admin' ? 'Manage shows & view all bookings' : 'Browse shows & book tickets'}</div>
              </div>
              <div className={`rc-check ${role === r ? 'on' : ''}`}>{role === r ? '✓' : ''}</div>
            </button>
          ))}
        </div>

        <div className="login-note">
          ℹ️ No real authentication. This is a demo — select any role and continue.
        </div>

        <button className="btn btn-primary btn-lg login-go" onClick={go}>
          Continue as {role === 'admin' ? 'Admin' : 'User'} →
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
