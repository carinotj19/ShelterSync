import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

/**
 * Top navigation bar. Shows navigation links based on user role.
 * - All users see the pet list
 * - Adopters see their adoption requests
 * - Shelters see options to add pets and manage adoption requests
 * - Admins see the admin dashboard
 * When authenticated, shows a logout button; otherwise shows login/signup.
 */
export default function NavBar() {
  const { token, role, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        ShelterSync
      </Link>
      <div className="links">
        <Link to="/">Pets</Link>
        
        {/* Adopter-specific links */}
        {token && role === 'adopter' && (
          <Link to="/my-requests">My Requests</Link>
        )}
        
        {/* Shelter-specific links */}
        {token && role === 'shelter' && (
          <>
            <Link to="/add">Add Pet</Link>
            <Link to="/adoption-requests">Adoption Requests</Link>
          </>
        )}
        
        {/* Admin-specific links */}
        {token && role === 'admin' && (
          <Link to="/admin">Admin Dashboard</Link>
        )}
      </div>
      <div className="auth-buttons">
        {token ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {role === 'admin' ? 'Admin' : role === 'shelter' ? 'Shelter' : 'Adopter'}
            </span>
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Signup</Link>
          </>
        )}
      </div>
    </nav>
  );
}
