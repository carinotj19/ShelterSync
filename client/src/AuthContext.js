import { createContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * A context for storing the authenticated user's token and role.
 * This centralises authentication state and avoids passing props down
 * through multiple levels of the component tree.
 */
export const AuthContext = createContext({
  token: '',
  role: '',
  setToken: () => { },
  setRole: () => { },
  logout: () => { },
});

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [role, setRole] = useState(() => localStorage.getItem('role') || '');

  // Persist authentication state to localStorage whenever it changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  useEffect(() => {
    if (role) {
      localStorage.setItem('role', role);
    } else {
      localStorage.removeItem('role');
    }
  }, [role]);

  const logout = () => {
    setToken('');
    setRole('');
  };

  return (
    <AuthContext.Provider value={{ token, role, setToken, setRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};