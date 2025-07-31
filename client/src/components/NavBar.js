// components/NavBar.js
import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { HiMenu, HiX } from 'react-icons/hi';

export default function NavBar() {
  const { token, role, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="backdrop-blur-md bg-white/70 shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-2xl font-bold text-brand">
            ShelterSync
          </Link>

          {/* desktop links */}
          <div className="hidden md:flex space-x-6 items-center">
            <Link to="/" className="hover:text-brand transition">Pets</Link>
            {token && role === 'shelter' && (
              <Link to="/add" className="hover:text-brand transition">Add Pet</Link>
            )}

            {token ? (
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
              >
                Logout
              </button>
            ) : (
              <>
                <Link to="/login" className="hover:text-brand transition">Login</Link>
                <Link
                  to="/signup"
                  className="bg-brand text-white px-3 py-1 rounded hover:bg-brand-hover transition"
                >
                  Signup
                </Link>
              </>
            )}
          </div>

          {/* mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setOpen(!open)}>
              {open ? <HiX size={24}/> : <HiMenu size={24}/>}
            </button>
          </div>
        </div>
      </div>

      {/* mobile menu */}
      {open && (
        <div className="md:hidden px-4 pb-4 space-y-2">
          <Link to="/" onClick={()=>setOpen(false)} className="block">Pets</Link>
          {token && role==='shelter' && (
            <Link to="/add" onClick={()=>setOpen(false)} className="block">Add Pet</Link>
          )}
          {token ? (
            <button
              onClick={() => { setOpen(false); handleLogout(); }}
              className="w-full text-left text-red-500"
            >
              Logout
            </button>
          ) : (
            <>
              <Link to="/login" onClick={()=>setOpen(false)} className="block">Login</Link>
              <Link to="/signup" onClick={()=>setOpen(false)} className="block">Signup</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
