const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { ValidationError, AuthenticationError, ConflictError, NotFoundError } = require('../utils/errors');
const config = require('../config/config');
const logger = require('../utils/logger');
const { sendEmail } = require('../utils/email');

class UserService {
  // Create a new user
  static async createUser(userData) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }

      // Create user
      const user = await User.create(userData);

      // Generate email verification token if email service is configured
      if (config.email.user && config.email.pass) {
        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.emailVerificationToken = verificationToken;
        await user.save();

        // Send verification email (don't await to avoid blocking)
        this.sendVerificationEmail(user.email, verificationToken).catch(err => {
          logger.error('Failed to send verification email', { error: err.message, email: user.email });
        });
      }

      logger.info('User created successfully', { userId: user._id, email: user.email });
      return user;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictError('User with this email already exists');
      }
      throw error;
    }
  }

  // Authenticate user
  static async authenticateUser(email, password) {
    try {
      // Find user with password and login attempt fields
      const user = await User.findForAuth(email);

      if (!user) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Check if account is locked
      if (user.isLocked) {
        throw new AuthenticationError('Account is temporarily locked due to too many failed login attempts');
      }

      // Check password
      const isPasswordCorrect = await user.correctPassword(password, user.password);

      if (!isPasswordCorrect) {
        // Increment login attempts
        await user.incLoginAttempts();
        throw new AuthenticationError('Invalid email or password');
      }

      // Reset login attempts on successful login
      if (user.loginAttempts > 0) {
        await user.resetLoginAttempts();
      }

      // Generate JWT token
      const token = this.generateToken(user._id, user.role);

      logger.info('User authenticated successfully', { userId: user._id, email: user.email });

      return {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          location: user.location,
          emailVerified: user.emailVerified
        }
      };
    } catch (error) {
      logger.warn('Authentication failed', { email, error: error.message });
      throw error;
    }
  }

  // Generate JWT token
  static generateToken(userId, role) {
    return jwt.sign(
      { id: userId, role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  // Get user by ID
  static async getUserById(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  // Update user profile
  static async updateUser(userId, updateData) {
    // Remove sensitive fields that shouldn't be updated directly
    const allowedUpdates = { ...updateData };
    delete allowedUpdates.password;
    delete allowedUpdates.role;
    delete allowedUpdates.active;
    delete allowedUpdates.loginAttempts;
    delete allowedUpdates.lockUntil;

    const user = await User.findByIdAndUpdate(
      userId,
      allowedUpdates,
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    logger.info('User updated successfully', { userId, updatedFields: Object.keys(allowedUpdates) });
    return user;
  }

  // Change password
  static async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isCurrentPasswordCorrect = await user.correctPassword(currentPassword, user.password);
    if (!isCurrentPasswordCorrect) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.info('Password changed successfully', { userId });
    return { message: 'Password changed successfully' };
  }

  // Request password reset
  static async requestPasswordReset(email) {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not
      return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send reset email
    try {
      await this.sendPasswordResetEmail(user.email, resetToken);
      logger.info('Password reset email sent', { email });
    } catch (error) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      throw new Error('Failed to send password reset email');
    }

    return { message: 'Password reset link sent to your email' };
  }

  // Reset password with token
  static async resetPassword(token, newPassword) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw new ValidationError('Token is invalid or has expired');
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    logger.info('Password reset successfully', { userId: user._id });
    return { message: 'Password reset successfully' };
  }

  // Verify email
  static async verifyEmail(token) {
    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) {
      throw new ValidationError('Invalid verification token');
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    logger.info('Email verified successfully', { userId: user._id });
    return { message: 'Email verified successfully' };
  }

  // Deactivate user account
  static async deactivateUser(userId) {
    const user = await User.findByIdAndUpdate(
      userId,
      { active: false },
      { new: true }
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    logger.info('User account deactivated', { userId });
    return { message: 'Account deactivated successfully' };
  }

  // Get users with pagination (admin only)
  static async getUsers(page = 1, limit = 10, filters = {}) {
    const skip = (page - 1) * limit;
    const query = { active: { $ne: false }, ...filters };

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Send verification email
  static async sendVerificationEmail(email, token) {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;

    await sendEmail({
      to: email,
      subject: 'Verify Your Email - ShelterSync',
      html: `
        <h2>Welcome to ShelterSync!</h2>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>If you didn't create an account, please ignore this email.</p>
        <p>This link will expire in 24 hours.</p>
      `
    });
  }

  // Send password reset email
  static async sendPasswordResetEmail(email, token) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

    await sendEmail({
      to: email,
      subject: 'Password Reset - ShelterSync',
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
        <p>This link will expire in 10 minutes.</p>
      `
    });
  }
}

module.exports = UserService;
