const router = require('express').Router();
const AdoptionService = require('../services/AdoptionService');
const { catchAsync } = require('../middleware/errorHandler');
const { validate, adoptionRequestSchema } = require('../utils/validation');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

// Create adoption request
router.post(
  '/:petId',
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
router.get(
  '/my-requests',
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
router.get(
  '/shelter/:shelterId',
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
router.get(
  '/:requestId',
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
router.patch(
  '/:requestId/approve',
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
router.patch(
  '/:requestId/reject',
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
router.patch(
  '/:requestId/withdraw',
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
router.post(
  '/:requestId/notes',
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
router.get(
  '/statistics/overview',
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
router.patch(
  '/bulk/update-status',
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
          result = await AdoptionService.approveRequest(
            requestId,
            req.user._id,
            response
          );
        } else {
          result = await AdoptionService.rejectRequest(
            requestId,
            req.user._id,
            response
          );
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
router.get(
  '/analytics/trends',
  authenticate,
  authorize('admin'),
  catchAsync(async (req, res) => {
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

