const AdoptionRequest = require('../models/AdoptionRequest');
const Pet = require('../models/Pet');
const { ValidationError, NotFoundError, AuthorizationError } = require('../utils/errors');
const logger = require('../utils/logger');
const { sendEmail } = require('../utils/email');

class AdoptionService {
  // Create adoption request
  static async createAdoptionRequest(petId, adopterId, requestData) {
    try {
      // Check if pet exists and is available
      const pet = await Pet.findById(petId).populate('shelter', 'name email');
      if (!pet) {
        throw new NotFoundError('Pet not found');
      }

      if (!pet.canBeAdopted()) {
        throw new ValidationError('Pet is not available for adoption');
      }

      // Check if user already has a pending request for this pet
      const existingRequest = await AdoptionRequest.findOne({
        pet: petId,
        adopter: adopterId,
        status: 'pending'
      });

      if (existingRequest) {
        throw new ValidationError('You already have a pending request for this pet');
      }

      // Create adoption request
      const adoptionRequest = await AdoptionRequest.create({
        pet: petId,
        adopter: adopterId,
        shelter: pet.shelter._id,
        message: requestData.message,
        adopterInfo: requestData.adopterInfo || {}
      });

      // Populate the request
      await adoptionRequest.populate([
        { path: 'pet', select: 'name breed age imageURL' },
        { path: 'adopter', select: 'name email location' },
        { path: 'shelter', select: 'name email' }
      ]);

      // Update pet status to pending if this is the first request
      const requestCount = await AdoptionRequest.countDocuments({
        pet: petId,
        status: 'pending'
      });

      if (requestCount === 1) {
        pet.status = 'pending';
        await pet.save();
      }

      // Send notification email to shelter
      this.sendAdoptionRequestNotification(adoptionRequest).catch(err => {
        logger.error('Failed to send adoption request notification', {
          error: err.message,
          requestId: adoptionRequest._id
        });
      });

      logger.info('Adoption request created successfully', {
        requestId: adoptionRequest._id,
        petId,
        adopterId,
        shelterId: pet.shelter._id
      });

      return adoptionRequest;
    } catch (error) {
      logger.error('Failed to create adoption request', {
        error: error.message,
        petId,
        adopterId
      });
      throw error;
    }
  }

  // Get adoption requests for adopter
  static async getAdopterRequests(adopterId, page = 1, limit = 10, status = null) {
    try {
      const requests = await AdoptionRequest.getForAdopter(adopterId, page, limit);
      const total = await AdoptionRequest.countDocuments({
        adopter: adopterId,
        ...(status && { status })
      });

      logger.info('Adopter requests retrieved successfully', {
        adopterId,
        count: requests.length,
        total
      });

      return {
        requests,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to retrieve adopter requests', {
        error: error.message,
        adopterId
      });
      throw error;
    }
  }

  // Get adoption requests for shelter
  static async getShelterRequests(shelterId, page = 1, limit = 10, status = null) {
    try {
      const requests = await AdoptionRequest.getForShelter(shelterId, status, page, limit);
      const total = await AdoptionRequest.countDocuments({
        shelter: shelterId,
        ...(status && { status })
      });

      logger.info('Shelter requests retrieved successfully', {
        shelterId,
        count: requests.length,
        total
      });

      return {
        requests,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to retrieve shelter requests', {
        error: error.message,
        shelterId
      });
      throw error;
    }
  }

  // Get adoption request by ID
  static async getAdoptionRequestById(requestId, userId, userRole) {
    try {
      const request = await AdoptionRequest.findById(requestId)
        .populate([
          { path: 'pet', select: 'name breed age imageURL status' },
          { path: 'adopter', select: 'name email location' },
          { path: 'shelter', select: 'name email location' },
          { path: 'respondedBy', select: 'name' },
          { path: 'notes.addedBy', select: 'name' }
        ]);

      if (!request) {
        throw new NotFoundError('Adoption request not found');
      }

      // Check authorization
      const isAdopter = request.adopter._id.toString() === userId;
      const isShelter = request.shelter._id.toString() === userId;
      const isAdmin = userRole === 'admin';

      if (!isAdopter && !isShelter && !isAdmin) {
        throw new AuthorizationError('You do not have permission to view this request');
      }

      logger.info('Adoption request retrieved successfully', {
        requestId,
        userId,
        userRole
      });

      return request;
    } catch (error) {
      if (error.name === 'CastError') {
        throw new NotFoundError('Adoption request not found');
      }
      throw error;
    }
  }

  // Approve adoption request
  static async approveRequest(requestId, shelterId, response = '') {
    try {
      const request = await AdoptionRequest.findById(requestId)
        .populate('pet')
        .populate('adopter', 'name email');

      if (!request) {
        throw new NotFoundError('Adoption request not found');
      }

      // Check authorization
      if (request.shelter.toString() !== shelterId) {
        throw new AuthorizationError('You can only respond to your own adoption requests');
      }

      if (!request.canBeModified()) {
        throw new ValidationError('This request has already been processed');
      }

      // Approve the request
      await request.approve(shelterId, response);

      // Mark pet as adopted
      const pet = request.pet;
      await pet.markAsAdopted(request.adopter._id);

      // Reject all other pending requests for this pet
      await AdoptionRequest.updateMany(
        {
          pet: pet._id,
          status: 'pending',
          _id: { $ne: requestId }
        },
        {
          status: 'rejected',
          shelterResponse: 'Pet has been adopted by another applicant',
          respondedAt: new Date(),
          respondedBy: shelterId
        }
      );

      // Send approval email
      this.sendApprovalEmail(request).catch(err => {
        logger.error('Failed to send approval email', {
          error: err.message,
          requestId
        });
      });

      logger.info('Adoption request approved successfully', {
        requestId,
        shelterId,
        petId: pet._id,
        adopterId: request.adopter._id
      });

      return request;
    } catch (error) {
      logger.error('Failed to approve adoption request', {
        error: error.message,
        requestId,
        shelterId
      });
      throw error;
    }
  }

  // Reject adoption request
  static async rejectRequest(requestId, shelterId, response = '') {
    try {
      const request = await AdoptionRequest.findById(requestId)
        .populate('adopter', 'name email');

      if (!request) {
        throw new NotFoundError('Adoption request not found');
      }

      // Check authorization
      if (request.shelter.toString() !== shelterId) {
        throw new AuthorizationError('You can only respond to your own adoption requests');
      }

      if (!request.canBeModified()) {
        throw new ValidationError('This request has already been processed');
      }

      // Reject the request
      await request.reject(shelterId, response);

      // Check if there are any other pending requests for this pet
      const pendingRequests = await AdoptionRequest.countDocuments({
        pet: request.pet,
        status: 'pending'
      });

      // If no pending requests, mark pet as available
      if (pendingRequests === 0) {
        await Pet.findByIdAndUpdate(request.pet, { status: 'available' });
      }

      // Send rejection email
      this.sendRejectionEmail(request).catch(err => {
        logger.error('Failed to send rejection email', {
          error: err.message,
          requestId
        });
      });

      logger.info('Adoption request rejected successfully', {
        requestId,
        shelterId
      });

      return request;
    } catch (error) {
      logger.error('Failed to reject adoption request', {
        error: error.message,
        requestId,
        shelterId
      });
      throw error;
    }
  }

  // Withdraw adoption request (by adopter)
  static async withdrawRequest(requestId, adopterId) {
    try {
      const request = await AdoptionRequest.findById(requestId);

      if (!request) {
        throw new NotFoundError('Adoption request not found');
      }

      // Check authorization
      if (request.adopter.toString() !== adopterId) {
        throw new AuthorizationError('You can only withdraw your own requests');
      }

      if (!request.canBeModified()) {
        throw new ValidationError('This request cannot be withdrawn');
      }

      // Withdraw the request
      request.status = 'withdrawn';
      await request.save();

      // Check if there are any other pending requests for this pet
      const pendingRequests = await AdoptionRequest.countDocuments({
        pet: request.pet,
        status: 'pending'
      });

      // If no pending requests, mark pet as available
      if (pendingRequests === 0) {
        await Pet.findByIdAndUpdate(request.pet, { status: 'available' });
      }

      logger.info('Adoption request withdrawn successfully', {
        requestId,
        adopterId
      });

      return request;
    } catch (error) {
      logger.error('Failed to withdraw adoption request', {
        error: error.message,
        requestId,
        adopterId
      });
      throw error;
    }
  }

  // Add note to adoption request
  static async addNote(requestId, userId, userRole, content) {
    try {
      const request = await AdoptionRequest.findById(requestId);

      if (!request) {
        throw new NotFoundError('Adoption request not found');
      }

      // Check authorization
      const isAdopter = request.adopter.toString() === userId;
      const isShelter = request.shelter.toString() === userId;
      const isAdmin = userRole === 'admin';

      if (!isAdopter && !isShelter && !isAdmin) {
        throw new AuthorizationError('You do not have permission to add notes to this request');
      }

      // Add note
      await request.addNote(content, userId);

      logger.info('Note added to adoption request', {
        requestId,
        userId,
        noteLength: content.length
      });

      return request;
    } catch (error) {
      logger.error('Failed to add note to adoption request', {
        error: error.message,
        requestId,
        userId
      });
      throw error;
    }
  }

  // Get adoption statistics
  static async getAdoptionStatistics(shelterId = null) {
    try {
      const matchStage = shelterId ? { shelter: shelterId } : {};

      const stats = await AdoptionRequest.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            approved: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
            },
            rejected: {
              $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
            },
            withdrawn: {
              $sum: { $cond: [{ $eq: ['$status', 'withdrawn'] }, 1, 0] }
            },
            avgResponseTime: {
              $avg: {
                $cond: [
                  { $ne: ['$respondedAt', null] },
                  { $subtract: ['$respondedAt', '$createdAt'] },
                  null
                ]
              }
            }
          }
        }
      ]);

      const result = stats[0] || {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        withdrawn: 0,
        avgResponseTime: null
      };

      // Convert average response time from milliseconds to hours
      if (result.avgResponseTime) {
        result.avgResponseTimeHours = Math.round(result.avgResponseTime / (1000 * 60 * 60));
      }

      logger.info('Adoption statistics retrieved', { shelterId, stats: result });
      return result;
    } catch (error) {
      logger.error('Failed to retrieve adoption statistics', {
        error: error.message,
        shelterId
      });
      throw error;
    }
  }

  // Send adoption request notification email
  static async sendAdoptionRequestNotification(request) {
    if (!request.shelter.email) return;

    await sendEmail({
      to: request.shelter.email,
      subject: `New Adoption Request - ${request.pet.name}`,
      html: `
        <h2>New Adoption Request</h2>
        <p>You have received a new adoption request for <strong>${request.pet.name}</strong>.</p>
        <h3>Adopter Information:</h3>
        <ul>
          <li><strong>Name:</strong> ${request.adopter.name}</li>
          <li><strong>Email:</strong> ${request.adopter.email}</li>
          <li><strong>Location:</strong> ${request.adopter.location || 'Not specified'}</li>
        </ul>
        <h3>Message:</h3>
        <p>${request.message}</p>
        <p><a href="${process.env.CLIENT_URL}/dashboard/requests/${request._id}">View Request</a></p>
      `
    });
  }

  // Send approval email
  static async sendApprovalEmail(request) {
    if (!request.adopter.email) return;

    await sendEmail({
      to: request.adopter.email,
      subject: `Adoption Request Approved - ${request.pet.name}`,
      html: `
        <h2>Congratulations! Your Adoption Request Has Been Approved</h2>
        <p>Great news! Your adoption request for <strong>${request.pet.name}</strong> has been approved.</p>
        ${request.shelterResponse ? `<h3>Message from Shelter:</h3><p>${request.shelterResponse}</p>` : ''}
        <p>Please contact the shelter to arrange pickup and complete the adoption process.</p>
        <p><a href="${process.env.CLIENT_URL}/dashboard/requests/${request._id}">View Request Details</a></p>
      `
    });
  }

  // Send rejection email
  static async sendRejectionEmail(request) {
    if (!request.adopter.email) return;

    await sendEmail({
      to: request.adopter.email,
      subject: `Adoption Request Update - ${request.pet.name}`,
      html: `
        <h2>Adoption Request Update</h2>
        <p>Thank you for your interest in <strong>${request.pet.name}</strong>. Unfortunately, your adoption request was not approved at this time.</p>
        ${request.shelterResponse ? `<h3>Message from Shelter:</h3><p>${request.shelterResponse}</p>` : ''}
        <p>Don't give up! There are many other wonderful pets looking for homes.</p>
        <p><a href="${process.env.CLIENT_URL}/pets">Browse Available Pets</a></p>
      `
    });
  }
}

module.exports = AdoptionService;
