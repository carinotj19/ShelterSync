const router = require('express').Router();
const AdoptionRequest = require('../models/AdoptionRequest');
const Pet = require('../models/Pet');
const User = require('../models/User');
const { auth } = require('./middleware');
const { sendEmail } = require('../utils/email');

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

module.exports = router;
