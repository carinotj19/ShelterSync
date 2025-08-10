import { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { AuthContext } from '../AuthContext';
import {
  HiMenu,
  HiX,
  HiHome,
  HiPlus,
  HiLogin,
  HiUserAdd,
  HiLogout,
  HiHeart,
  HiUser,
  HiViewGrid
} from 'react-icons/hi';

export default function NavBar() {
  const { token, role, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const NavLink = ({ to, children, icon: Icon, onClick }) => (
    <Link
      to={to}
      onClick={onClick}
      className={`
        group relative flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200
        ${isActive(to)
          ? 'text-brand bg-brand/10 shadow-soft'
          : 'text-neutral-600 hover:text-brand hover:bg-brand/5'
        }
      `}
    >
      {Icon && <Icon className="w-4 h-4" />}
      <span>{children}</span>
      {isActive(to) && (
        <div className="absolute inset-x-0 -bottom-1 h-0.5 bg-brand rounded-full" />
      )}
    </Link>
  );

  NavLink.propTypes = {
    to: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    icon: PropTypes.elementType,
    onClick: PropTypes.func,
  };

  const MobileNavLink = ({ to, children, icon: Icon, onClick }) => (
    <Link
      to={to}
      onClick={onClick}
      className={`
        flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200
        ${isActive(to)
          ? 'text-brand bg-brand/10 border-l-4 border-brand'
          : 'text-neutral-700 hover:text-brand hover:bg-brand/5'
        }
      `}
    >
      {Icon && <Icon className="w-5 h-5" />}
      <span>{children}</span>
    </Link>
  );

  MobileNavLink.propTypes = {
    to: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    icon: PropTypes.elementType,
    onClick: PropTypes.func,
  };

  return (
    <>
      <nav
        className={`
          fixed top-0 left-0 right-0 z-50 border-b border-neutral-200
          transition-all duration-300
          ${scrolled
            ? 'bg-white/90 backdrop-blur-lg shadow-md'
            : 'bg-white/60 backdrop-blur-lg'
          }
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center space-x-2 group"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-brand to-accent rounded-xl flex items-center justify-center shadow-soft group-hover:shadow-brand transition-all duration-300">
                <HiHeart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-display font-bold gradient-text">
                ShelterSync
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <NavLink to="/" icon={HiHome}>
                Pets
              </NavLink>

              {token && role === 'admin' && (
                <NavLink to="/admin" icon={HiViewGrid}>
                  Dashboard
                </NavLink>
              )}

              {token && role === 'shelter' && (
                <NavLink to="/add" icon={HiPlus}>
                  Add Pet
                </NavLink>
              )}

              {/* User Menu */}
              {token ? (
                <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-neutral-200">
                  <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-neutral-50">
                    <div className="w-8 h-8 bg-gradient-to-br from-brand to-accent rounded-full flex items-center justify-center">
                      <HiUser className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-neutral-700 capitalize">
                      {role}
                    </span>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="btn-danger flex items-center space-x-2 px-4 py-2"
                  >
                    <HiLogout className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-neutral-200">
                  <NavLink to="/login" icon={HiLogin}>
                    Login
                  </NavLink>
                  <Link
                    to="/signup"
                    className="btn-primary flex items-center space-x-2"
                  >
                    <HiUserAdd className="w-4 h-4" />
                    <span>Sign Up</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden p-2 rounded-xl text-neutral-600 hover:text-brand hover:bg-brand/5 transition-all duration-200"
            >
              {open ? <HiX size={24} /> : <HiMenu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`
          md:hidden transition-all duration-300 ease-in-out overflow-hidden
          ${open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
        `}>
          <div className="px-4 py-4 bg-white/95 backdrop-blur-md border-t border-neutral-100 space-y-2">
            <MobileNavLink to="/" icon={HiHome} onClick={() => setOpen(false)}>
              Pets
            </MobileNavLink>
            {token && role === 'admin' && (
              <MobileNavLink to="/admin" icon={HiViewGrid} onClick={() => setOpen(false)}>
                Dashboard
              </MobileNavLink>
            )}
            {token && role === 'shelter' && (
              <MobileNavLink to="/add" icon={HiPlus} onClick={() => setOpen(false)}>
                Add Pet
              </MobileNavLink>
            )}

            <div className="border-t border-neutral-100 pt-4 mt-4">
              {token ? (
                <>
                  <div className="flex items-center space-x-3 px-4 py-3 mb-2 bg-neutral-50 rounded-xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-brand to-accent rounded-full flex items-center justify-center">
                      <HiUser className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Welcome back!</p>
                      <p className="text-xs text-neutral-500 capitalize">{role} account</p>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-error hover:bg-error/5 transition-all duration-200"
                  >
                    <HiLogout className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <MobileNavLink to="/login" icon={HiLogin} onClick={() => setOpen(false)}>
                    Login
                  </MobileNavLink>
                  <MobileNavLink to="/signup" icon={HiUserAdd} onClick={() => setOpen(false)}>
                    Sign Up
                  </MobileNavLink>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer to prevent content from hiding behind fixed navbar */}
      <div className="h-16" />
    </>
  );
}
