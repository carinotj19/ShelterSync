// App.js
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';
import NavBar from './components/NavBar';

// lazy load all page‐level components
const PetList = lazy(() => import('./components/PetList'));
const PetDetail = lazy(() => import('./components/PetDetail'));
const PetForm = lazy(() => import('./components/PetForm'));
const Login = lazy(() => import('./components/Login'));
const Signup = lazy(() => import('./components/Signup'));

// a simple 404 page
function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-gray-600">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="mt-4 text-xl">Oops, that page doesn’t exist.</p>
      <a href="/" className="mt-6 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition">
        Go Home
      </a>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <NavBar />
        <Toaster position="top-right" />
        <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-green-50">
          <div className="blob -top-40 -left-40 w-96 h-96 bg-blue-300" />
          <div className="blob bottom-0 right-0 w-80 h-80 bg-green-200" />
          <main className="max-w-6xl mx-auto py-10 px-4">
            <Suspense fallback={
              <div className="text-center py-20 text-gray-500">Loading…</div>
            }>
              <Routes>
                <Route path="/" element={<PetList />} />
                <Route path="/pets/:id" element={<PetDetail />} />
                <Route
                  path="/add"
                  element={
                    <ProtectedRoute allowedRoles={['shelter']}>
                      <PetForm />
                    </ProtectedRoute>
                  }
                />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
