import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';
import NavBar from './components/NavBar';
import PetList from './components/PetList';
import PetDetail from './components/PetDetail';
import PetForm from './components/PetForm';
import Login from './components/Login';
import Signup from './components/Signup';
import './App.css';

/**
 * The root application component. It sets up the router, authentication
 * context and defines the available routes. Public routes include the
 * pet list, login and signup. Private routes are wrapped in
 * ProtectedRoute and restricted by user role.
 */
function App() {
  return (
    <AuthProvider>
      <Router>
        <NavBar />
        <main className="container">
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
          </Routes>
        </main>
      </Router>
    </AuthProvider>
  );
}

export default App;