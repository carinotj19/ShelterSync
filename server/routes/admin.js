const router = require('express').Router();
const User = require('../models/User');
const Pet = require('../models/Pet');
const AdoptionRequest = require('../models/AdoptionRequest');
const { auth } = require('./middleware');

// Get all users (admin only)
router.get('/users', auth('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a user (admin only)
router.delete('/users/:userId', auth('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Don't allow deleting other admins
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete admin users' });
    }
    
    // If user is a shelter, delete their pets first
    if (user.role === 'shelter') {
      await Pet.deleteMany({ shelter: user._id });
    }
    
    // Delete user's adoption requests
    await AdoptionRequest.deleteMany({ adopter: user._id });
    
    // Delete the user
    await user.deleteOne();
    
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user role (admin only)
router.patch('/users/:userId/role', auth('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['adopter', 'shelter'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Don't allow changing admin roles
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot change admin role' });
    }
    
    user.role = role;
    await user.save();
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get platform statistics (admin only)
router.get('/stats', auth('admin'), async (req, res) => {
  try {
    const [
      totalUsers,
      totalAdopters,
      totalShelters,
      totalPets,
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'adopter' }),
      User.countDocuments({ role: 'shelter' }),
      Pet.countDocuments(),
      AdoptionRequest.countDocuments(),
      AdoptionRequest.countDocuments({ status: 'pending' }),
      AdoptionRequest.countDocuments({ status: 'approved' }),
      AdoptionRequest.countDocuments({ status: 'rejected' })
    ]);
    
    res.json({
      users: {
        total: totalUsers,
        adopters: totalAdopters,
        shelters: totalShelters
      },
      pets: {
        total: totalPets
      },
      adoptionRequests: {
        total: totalRequests,
        pending: pendingRequests,
        approved: approvedRequests,
        rejected: rejectedRequests
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
