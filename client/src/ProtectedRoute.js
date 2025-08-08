import { useContext } from 'react';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';

/**
 * A wrapper around route components that restricts access based on the
 * authenticated role. If no token is present or the role is not in
 * allowedRoles, users are redirected to the login page.
 *
 * Usage:
 * <ProtectedRoute allowedRoles={['shelter']}>
 *   <PetForm />
 * </ProtectedRoute>
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { token, role } = useContext(AuthContext);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string)
};