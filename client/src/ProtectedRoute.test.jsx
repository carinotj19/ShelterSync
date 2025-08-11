import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { AuthContext } from './AuthContext';

test('renders children when authorized', () => {
  render(
    <AuthContext.Provider value={{ token: 'abc', role: 'user' }}>
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route
            path="/private"
            element={
              <ProtectedRoute>
                <div>Secret</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
  expect(screen.getByText('Secret')).toBeInTheDocument();
});

test('redirects to login when not authenticated', () => {
  render(
    <AuthContext.Provider value={{ token: null, role: null }}>
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route
            path="/private"
            element={
              <ProtectedRoute>
                <div>Secret</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
  expect(screen.getByText('Login Page')).toBeInTheDocument();
});