const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');
const { catchAsync } = require('./errorHandler');
const { AuthenticationError, AuthorizationError } = require('../utils/errors');
const config = require('../config/config');
const logger = require('../utils/logger');

// Enhanced authentication middleware
const authenticate = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    logger.warn('Authentication failed: No token provided', { ip: req.ip });
    throw new AuthenticationError('You are not logged in! Please log in to get access.');
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, config.jwt.secret);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id).select('+active');
  if (!currentUser) {
    logger.warn('Authentication failed: User no longer exists', { userId: decoded.id });
    throw new AuthenticationError('The user belonging to this token does no longer exist.');
  }

  // 4) Check if user is active
  if (currentUser.active === false) {
    logger.warn('Authentication failed: User account is deactivated', { userId: decoded.id });
    throw new AuthenticationError('Your account has been deactivated. Please contact support.');
  }

  // 5) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter && currentUser.changedPasswordAfter(decoded.iat)) {
    logger.warn('Authentication failed: Password changed after token issued', { userId: decoded.id });
    throw new AuthenticationError('User recently changed password! Please log in again.');
  }

  // Grant access to protected route
  req.user = currentUser;
  logger.info('User authenticated successfully', { userId: currentUser._id, role: currentUser.role });
  next();
});

// Authorization middleware factory
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AuthenticationError('You must be logged in to access this resource.');
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Authorization failed: Insufficient permissions', {
        userId: req.user._id,
        userRole: req.user.role,
        requiredRoles: roles
      });
      throw new AuthorizationError('You do not have permission to perform this action.');
    }

    logger.info('User authorized successfully', {
      userId: req.user._id,
      role: req.user.role,
      action: req.method + ' ' + req.originalUrl
    });
    next();
  };
};

// Check if user owns resource or is admin
const checkOwnership = (getResourceUserId) => {
  return catchAsync(async (req, res, next) => {
    if (!req.user) {
      throw new AuthenticationError('You must be logged in to access this resource.');
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    const resourceUserId = await getResourceUserId(req);

    if (!resourceUserId) {
      throw new AuthorizationError('Resource not found or access denied.');
    }

    if (resourceUserId.toString() !== req.user._id.toString()) {
      logger.warn('Ownership check failed', {
        userId: req.user._id,
        resourceUserId,
        resource: req.originalUrl
      });
      throw new AuthorizationError('You can only access your own resources.');
    }

    next();
  });
};

// Legacy auth function for backward compatibility
function auth(requiredRole) {
  return (req, res, next) => {
    authenticate(req, res, (err) => {
      if (err) {
        return next(err);
      }

      if (requiredRole && req.user.role !== requiredRole && req.user.role !== 'admin') {
        return next(new AuthorizationError('Insufficient permissions.'));
      }

      next();
    });
  };
}

module.exports = {
  auth, // Keep for backward compatibility
  authenticate,
  authorize,
  checkOwnership
};
