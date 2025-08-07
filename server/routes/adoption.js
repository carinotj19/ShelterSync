const router = require('express').Router();
const AdoptionService = require('../services/AdoptionService');
const { catchAsync } = require('../middleware/errorHandler');
const { validate, adoptionRequestSchema } = require('../utils/validation');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

// Create adoption request
router.post('/:petId', auth('adopter'), async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.petId).populate('shelter');
    if (!pet) return res.status(404).json({ error: 'Pet not found' });
    
    // Check if user already has a pending request for this pet
    const existingRequest = await AdoptionRequest.findOne({
      pet: pet._id,
      adopter: req.user.id,
      status: 'pending'
    });
    
    if (existingRequest) {
      return res.status(400).json({ error: 'You already have a pending request for this pet' });
    }
    
    const request = await AdoptionRequest.create({
      pet: pet._id,
      adopter: req.user.id,
      message: req.body.message
    });
    
    // send email to shelter
    await sendEmail({
      to: pet.shelter.email,
      subject: 'New Adoption Request',
      text: `You have a new adoption request for ${pet.name}.\n\nMessage from adopter: ${req.body.message}`
    });
    
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all adoption requests for a shelter
router.get('/shelter/requests', auth('shelter'), async (req, res) => {
  try {
    // Find all pets belonging to this shelter
    const shelterPets = await Pet.find({ shelter: req.user.id }).select('_id');
    const petIds = shelterPets.map(pet => pet._id);
    
    // Find all adoption requests for these pets
    const requests = await AdoptionRequest.find({ pet: { $in: petIds } })
      .populate('pet', 'name breed imageURL')
      .populate('adopter', 'name email location')
      .sort('-createdAt');
    
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get adoption requests for a specific pet (shelter only)
router.get('/pet/:petId', auth('shelter'), async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.petId);
    if (!pet) return res.status(404).json({ error: 'Pet not found' });
    
    // Verify the pet belongs to this shelter
    if (String(pet.shelter) !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const requests = await AdoptionRequest.find({ pet: req.params.petId })
      .populate('adopter', 'name email location')
      .sort('-createdAt');
    
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's adoption requests
router.get('/my-requests', auth('adopter'), async (req, res) => {
  try {
    const requests = await AdoptionRequest.find({ adopter: req.user.id })
      .populate('pet', 'name breed imageURL location')
      .sort('-createdAt');
    
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update adoption request status (shelter only)
router.patch('/:requestId/status', auth('shelter'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const request = await AdoptionRequest.findById(req.params.requestId)
      .populate('pet')
      .populate('adopter');
    
    if (!request) return res.status(404).json({ error: 'Request not found' });
    
    // Verify the pet belongs to this shelter
    if (String(request.pet.shelter) !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    request.status = status;
    await request.save();
    
    // Send email to adopter about the decision
    const emailSubject = status === 'approved' 
      ? `Your adoption request for ${request.pet.name} has been approved!`
      : `Update on your adoption request for ${request.pet.name}`;
    
    const emailText = status === 'approved'
      ? `Great news! Your adoption request for ${request.pet.name} has been approved. The shelter will contact you soon with next steps.`
      : `Thank you for your interest in ${request.pet.name}. Unfortunately, your adoption request has not been approved at this time.`;
    
    await sendEmail({
      to: request.adopter.email,
      subject: emailSubject,
      text: emailText
    });
    
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get all adoption requests
router.get('/admin/all', auth('admin'), async (req, res) => {
  try {
    const requests = await AdoptionRequest.find()
      .populate('pet', 'name breed')
      .populate('adopter', 'name email')
      .populate({
        path: 'pet',
        populate: {
          path: 'shelter',
          select: 'name email'
        }
      })
      .sort('-createdAt');
    
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Create adoption request
router.post('/:petId',
  authenticate,
  authorize('adopter'),
  validate(adoptionRequestSchema),
  catchAsync(async (req, res) => {
    const { petId } = req.params;
    const adopterId = req.user._id;
    
    const adoptionRequest = await AdoptionService.createAdoptionRequest(
      petId,
      adopterId,
      req.body
    );

    logger.info('Adoption request created', {
      requestId: adoptionRequest._id,
      petId,
      adopterId
    });

    res.status(201).json({
      status: 'success',
      message: 'Adoption request submitted successfully',
      data: {
        adoptionRequest
      }
    });
  })
);

// Get adoption requests for current user
router.get('/my-requests',
  authenticate,
  catchAsync(async (req, res) => {
    const { page, limit, status } = req.query;
    let result;

    if (req.user.role === 'adopter') {
      result = await AdoptionService.getAdopterRequests(
        req.user._id,
        parseInt(page) || 1,
        parseInt(limit) || 10,
        status
      );
    } else if (req.user.role === 'shelter') {
      result = await AdoptionService.getShelterRequests(
        req.user._id,
        parseInt(page) || 1,
        parseInt(limit) || 10,
        status
      );
    } else {
      return res.status(403).json({
        status: 'fail',
        message: 'Access denied'
      });
    }

    res.json({
      status: 'success',
      data: {
        requests: result.requests,
        pagination: result.pagination
      }
    });
  })
);

// Get adoption requests for a specific shelter (shelter/admin only)
router.get('/shelter/:shelterId',
  authenticate,
  authorize('shelter', 'admin'),
  catchAsync(async (req, res) => {
    const { shelterId } = req.params;
    const { page, limit, status } = req.query;

    // Check if user can access this shelter's requests
    if (req.user.role === 'shelter' && req.user._id.toString() !== shelterId) {
      return res.status(403).json({
        status: 'fail',
        message: 'You can only access your own adoption requests'
      });
    }

    const result = await AdoptionService.getShelterRequests(
      shelterId,
      parseInt(page) || 1,
      parseInt(limit) || 10,
      status
    );

    res.json({
      status: 'success',
      data: {
        requests: result.requests,
        pagination: result.pagination
      }
    });
  })
);

// Get single adoption request by ID
router.get('/:requestId',
  authenticate,
  catchAsync(async (req, res) => {
    const { requestId } = req.params;
    
    const adoptionRequest = await AdoptionService.getAdoptionRequestById(
      requestId,
      req.user._id,
      req.user.role
    );

    res.json({
      status: 'success',
      data: {
        adoptionRequest
      }
    });
  })
);

// Approve adoption request (shelter only)
router.patch('/:requestId/approve',
  authenticate,
  authorize('shelter', 'admin'),
  catchAsync(async (req, res) => {
    const { requestId } = req.params;
    const { response } = req.body;
    
    const adoptionRequest = await AdoptionService.approveRequest(
      requestId,
      req.user._id,
      response || ''
    );

    logger.info('Adoption request approved', {
      requestId,
      shelterId: req.user._id
    });

    res.json({
      status: 'success',
      message: 'Adoption request approved successfully',
      data: {
        adoptionRequest
      }
    });
  })
);

// Reject adoption request (shelter only)
router.patch('/:requestId/reject',
  authenticate,
  authorize('shelter', 'admin'),
  catchAsync(async (req, res) => {
    const { requestId } = req.params;
    const { response } = req.body;
    
    const adoptionRequest = await AdoptionService.rejectRequest(
      requestId,
      req.user._id,
      response || ''
    );

    logger.info('Adoption request rejected', {
      requestId,
      shelterId: req.user._id
    });

    res.json({
      status: 'success',
      message: 'Adoption request rejected',
      data: {
        adoptionRequest
      }
    });
  })
);

// Withdraw adoption request (adopter only)
router.patch('/:requestId/withdraw',
  authenticate,
  authorize('adopter'),
  catchAsync(async (req, res) => {
    const { requestId } = req.params;
    
    const adoptionRequest = await AdoptionService.withdrawRequest(
      requestId,
      req.user._id
    );

    logger.info('Adoption request withdrawn', {
      requestId,
      adopterId: req.user._id
    });

    res.json({
      status: 'success',
      message: 'Adoption request withdrawn successfully',
      data: {
        adoptionRequest
      }
    });
  })
);

// Add note to adoption request
router.post('/:requestId/notes',
  authenticate,
  catchAsync(async (req, res) => {
    const { requestId } = req.params;
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Note content is required'
      });
    }

    const adoptionRequest = await AdoptionService.addNote(
      requestId,
      req.user._id,
      req.user.role,
      content.trim()
    );

    logger.info('Note added to adoption request', {
      requestId,
      userId: req.user._id
    });

    res.json({
      status: 'success',
      message: 'Note added successfully',
      data: {
        adoptionRequest
      }
    });
  })
);

// Get adoption statistics
router.get('/statistics/overview',
  authenticate,
  authorize('shelter', 'admin'),
  catchAsync(async (req, res) => {
    const shelterId = req.user.role === 'shelter' ? req.user._id : null;
    const stats = await AdoptionService.getAdoptionStatistics(shelterId);

    res.json({
      status: 'success',
      data: {
        statistics: stats
      }
    });
  })
);

// Bulk operations for adoption requests (admin only)
router.patch('/bulk/update-status',
  authenticate,
  authorize('admin'),
  catchAsync(async (req, res) => {
    const { requestIds, status, response } = req.body;
    
    if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Request IDs array is required'
      });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Status must be either approved or rejected'
      });
    }

    // Process each request individually for proper validation and logging
    const results = [];
    const errors = [];

    for (const requestId of requestIds) {
      try {
        let result;
        if (status === 'approved') {
          result = await AdoptionService.approveRequest(requestId, req.user._id, response);
        } else {
          result = await AdoptionService.rejectRequest(requestId, req.user._id, response);
        }
        results.push(result);
      } catch (error) {
        errors.push({ requestId, error: error.message });
      }
    }

    logger.info('Bulk adoption request update completed', {
      userId: req.user._id,
      status,
      successful: results.length,
      failed: errors.length
    });

    res.json({
      status: 'success',
      message: `Bulk update completed. ${results.length} successful, ${errors.length} failed.`,
      data: {
        successful: results,
        failed: errors
      }
    });
  })
);

// Get adoption request analytics (admin only)
router.get('/analytics/trends',
  authenticate,
  authorize('admin'),
  catchAsync(async (req, res) => {
    const { startDate, endDate, groupBy = 'month' } = req.query;
    
    // This would typically involve more complex aggregation queries
    // For now, return basic statistics
    const stats = await AdoptionService.getAdoptionStatistics();

    res.json({
      status: 'success',
      data: {
        analytics: {
          overview: stats,
          // Additional analytics would go here
          trends: [],
          demographics: {}
        }
      }
    });
  })
);

module.exports = router;

