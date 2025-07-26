const router = require('express').Router();
const AdoptionRequest = require('../models/AdoptionRequest');
const Pet = require('../models/Pet');
const User = require('../models/User');
const { auth } = require('./middleware');
const { sendEmail } = require('../utils/email');

router.post('/:petId', auth('adopter'), async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.petId).populate('shelter');
    if (!pet) return res.status(404).json({ error: 'Pet not found' });
    const request = await AdoptionRequest.create({
      pet: pet._id,
      adopter: req.user.id,
      message: req.body.message
    });
    // send email to shelter
    await sendEmail({
      to: pet.shelter.email,
      subject: 'New Adoption Request',
      text: `You have a new adoption request for ${pet.name}.`
    });
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;