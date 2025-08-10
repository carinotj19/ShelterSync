import { createContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

export const AuthContext = createContext({
  token: null,
  role: null,
  setAuth: () => {},
  logout: () => {},
});

function bootAuth() {
  // Prefer the consolidated "auth" payload; fall back to legacy keys if present
  const raw = localStorage.getItem('auth') || sessionStorage.getItem('auth');
  if (raw) {
    try { return JSON.parse(raw); } catch { /* noop */ }
  }
  const legacy = {
    token: localStorage.getItem('token') || '',
    role: localStorage.getItem('role') || '',
  };
  return { token: legacy.token || null, role: legacy.role || null };
}

export function AuthProvider({ children }) {
  const initial = bootAuth();
  const [token, setToken] = useState(initial.token);
  const [role, setRole] = useState(initial.role);

  // Single entry point to set auth + choose persistence
  const setAuth = (nextToken, nextRole, remember = false) => {
    setToken(nextToken);
    setRole(nextRole);

    const payload = JSON.stringify({ token: nextToken, role: nextRole });

    if (remember) {
      localStorage.setItem('auth', payload);
      sessionStorage.removeItem('auth');
    } else {
      sessionStorage.setItem('auth', payload);
      localStorage.removeItem('auth');
    }

    // Clean up legacy keys if they exist
    localStorage.removeItem('token');
    localStorage.removeItem('role');
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    localStorage.removeItem('auth');
    sessionStorage.removeItem('auth');
  };

  // Keep other tabs/windows in sync
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== 'auth') return;
      if (e.newValue) {
        try {
          const { token: t, role: r } = JSON.parse(e.newValue);
          setToken(t || null);
          setRole(r || null);
        } catch { /* ignore */ }
      } else {
        setToken(null);
        setRole(null);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo(() => ({ token, role, setAuth, logout }), [token, role]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = { children: PropTypes.node.isRequired };
