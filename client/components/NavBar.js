import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../src/AuthContext';
import '../src/App.css';

/**
 * Top navigation bar. Shows navigation links to the pet list, add pet,
 * login and signup pages. When a user is authenticated it shows a
 * logout button instead of login/signup. Shelter users also see an
 * option to add a pet.
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
        {token && role === 'shelter' && <Link to="/add">Add Pet</Link>}
      </div>
      <div className="auth-buttons">
        {token ? (
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
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