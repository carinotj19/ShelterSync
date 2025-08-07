const router = require('express').Router();
const UserService = require('../services/UserService');
const { catchAsync } = require('../middleware/errorHandler');
const { validate, userSignupSchema, userLoginSchema } = require('../utils/validation');
const { authLimiter } = require('../middleware/security');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

// Apply rate limiting to auth routes
router.use(authLimiter);

// Signup
router.post('/signup',
  validate(userSignupSchema),
  catchAsync(async (req, res) => {
    const user = await UserService.createUser(req.body);

    logger.info('User signup successful', {
      userId: user._id,
      email: user.email,
      role: user.role
    });

    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          location: user.location,
          emailVerified: user.emailVerified
        }
      }
    });
  })
);

// Login
router.post('/login',
  validate(userLoginSchema),
  catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const result = await UserService.authenticateUser(email, password);

    logger.info('User login successful', {
      userId: result.user.id,
      email: result.user.email
    });

    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        token: result.token,
        user: result.user
      }
    });
  })
);

// Get current user profile
router.get('/me',
  authenticate,
  catchAsync(async (req, res) => {
    const user = await UserService.getUserById(req.user._id);

    res.json({
      status: 'success',
      data: {
        user
      }
    });
  })
);

// Update user profile
router.patch('/me',
  authenticate,
  catchAsync(async (req, res) => {
    const user = await UserService.updateUser(req.user._id, req.body);

    logger.info('User profile updated', { userId: req.user._id });

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user
      }
    });
  })
);

// Change password
router.patch('/change-password',
  authenticate,
  catchAsync(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'fail',
        message: 'Current password and new password are required'
      });
    }

    await UserService.changePassword(req.user._id, currentPassword, newPassword);

    logger.info('Password changed successfully', { userId: req.user._id });

    res.json({
      status: 'success',
      message: 'Password changed successfully'
    });
  })
);

// Request password reset
router.post('/forgot-password',
  catchAsync(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'fail',
        message: 'Email is required'
      });
    }

    const result = await UserService.requestPasswordReset(email);

    res.json({
      status: 'success',
      message: result.message
    });
  })
);

// Reset password with token
router.patch('/reset-password/:token',
  catchAsync(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        status: 'fail',
        message: 'New password is required'
      });
    }

    const result = await UserService.resetPassword(token, password);

    logger.info('Password reset successful');

    res.json({
      status: 'success',
      message: result.message
    });
  })
);

// Verify email
router.get('/verify-email/:token',
  catchAsync(async (req, res) => {
    const { token } = req.params;
    const result = await UserService.verifyEmail(token);

    logger.info('Email verification successful');

    res.json({
      status: 'success',
      message: result.message
    });
  })
);

// Deactivate account
router.delete('/me',
  authenticate,
  catchAsync(async (req, res) => {
    await UserService.deactivateUser(req.user._id);

    logger.info('User account deactivated', { userId: req.user._id });

    res.json({
      status: 'success',
      message: 'Account deactivated successfully'
    });
  })
);

// Refresh token (optional - for implementing refresh token functionality)
router.post('/refresh-token',
  authenticate,
  catchAsync(async (req, res) => {
    const token = UserService.generateToken(req.user._id, req.user.role);

    res.json({
      status: 'success',
      data: {
        token
      }
    });
  })
);

module.exports = router;
