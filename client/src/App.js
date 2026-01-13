import { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HiExclamationCircle, HiHome, HiSparkles } from 'react-icons/hi';

import { AuthProvider } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';
import NavBar from './components/NavBar';
import AmbientBackdrop from "./components/AmbientBackdrop";

// Lazy load all page-level components
const PetList = lazy(() => import('./components/PetList'));
const PetDetail = lazy(() => import('./components/PetDetail'));
const PetForm = lazy(() => import('./components/PetForm'));
const Login = lazy(() => import('./components/Login'));
const Signup = lazy(() => import('./components/Signup'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));

// Enhanced 404 page
function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 mx-auto mb-8 bg-neutral-100 rounded-full flex items-center justify-center">
          <HiExclamationCircle className="w-12 h-12 text-neutral-400" />
        </div>

        <h1 className="text-6xl font-display font-bold text-neutral-900 mb-4">
          404
        </h1>

        <h2 className="text-2xl font-semibold text-neutral-700 mb-4">
          Page Not Found
        </h2>

        <p className="text-neutral-600 mb-8 leading-relaxed">
          Oops! The page you're looking for seems to have wandered off.
          Let's get you back to finding your perfect pet companion.
        </p>

        <div className="space-y-3">
          <Link
            to="/"
            className="btn-primary inline-flex items-center space-x-2"
          >
            <HiHome className="w-5 h-5" />
            <span>Go Home</span>
          </Link>

          <p className="text-sm text-neutral-500">
            Or browse our{' '}
            <Link to="/" className="text-brand hover:underline">
              available pets
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Enhanced loading component
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-brand to-accent rounded-full flex items-center justify-center animate-pulse">
            <HiSparkles className="w-8 h-8 text-white" />
          </div>
          <div className="absolute inset-0 w-16 h-16 mx-auto border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
        </div>

        <p className="text-neutral-600 font-medium">
          Loading amazing pets...
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
      <div className="min-h-screen bg-waves relative">
          {/* Background Elements */}
          <AmbientBackdrop />
          <div className="blob -top-40 -left-40 w-96 h-96 bg-brand-200" />
          <div className="blob bottom-0 right-0 w-80 h-80 bg-accent-200" />

          {/* Navigation */}
          <NavBar />

          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#374151',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.15)',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />

          {/* Main Content */}
          <main className="relative z-10 min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
              <Suspense fallback={<LoadingSpinner />}>
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
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/404" element={<NotFound />} />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Routes>
              </Suspense>
            </div>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
