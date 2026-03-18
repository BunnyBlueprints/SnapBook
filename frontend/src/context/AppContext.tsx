import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { AppContextType, Theme, UserRole, Show } from '../types';
import { showApi } from '../api';

const Ctx = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  /* ── Auth ── */
  const [auth, setAuth] = useState(() => {
    const s = localStorage.getItem('mx_auth');
    return s ? JSON.parse(s) : { isAuthenticated: false, role: 'user' as UserRole, name: '' };
  });

  /* ── Theme ── */
  const [theme, setTheme] = useState<Theme>(() => {
    const s = localStorage.getItem('mx_theme') as Theme;
    return s || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mx_theme', theme);
  }, [theme]);

  /* ── Shows ── */
  const [shows, setShows] = useState<Show[]>([]);
  const [loadingShows, setLoadingShows] = useState(false);
  const fetchedRef = useRef(false);

  const fetchShows = useCallback(async (force = false) => {
    if (fetchedRef.current && !force) return;
    setLoadingShows(true);
    try { setShows(await showApi.list()); fetchedRef.current = true; }
    catch (e) { console.error(e); }
    finally { setLoadingShows(false); }
  }, []);

  const invalidateShows = useCallback(() => { fetchedRef.current = false; }, []);

  useEffect(() => { fetchShows(); }, [fetchShows]);

  /* ── Actions ── */
  const login = useCallback((role: UserRole) => {
    const a = { isAuthenticated: true, role, name: role === 'admin' ? 'Admin' : 'Guest User' };
    setAuth(a); localStorage.setItem('mx_auth', JSON.stringify(a));
  }, []);

  const logout = useCallback(() => {
    const a = { isAuthenticated: false, role: 'user' as UserRole, name: '' };
    setAuth(a); localStorage.removeItem('mx_auth'); fetchedRef.current = false;
  }, []);

  const toggleTheme = useCallback(() => setTheme(t => t === 'light' ? 'dark' : 'light'), []);

  return (
    <Ctx.Provider value={{ auth, theme, shows, loadingShows, login, logout, toggleTheme, fetchShows, invalidateShows }}>
      {children}
    </Ctx.Provider>
  );
};

export const useApp = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp must be inside AppProvider');
  return c;
};
