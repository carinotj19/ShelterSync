const router = require('express').Router();
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const mongoose = require('mongoose');
const Pet = require('../models/Pet');
const { auth } = require('./middleware');

const storage = new GridFsStorage({ url: process.env.MONGO_URI });
const upload = multer({ storage });

// Create pet
router.post('/', auth('shelter'), upload.single('image'), async (req, res) => {
  try {
    const pet = await Pet.create({
      ...req.body,
      imageURL: req.file ? `/image/${req.file.id}` : undefined,
      shelter: req.user.id
    });
    res.json(pet);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all pets with filters
router.get('/', async (req, res) => {
  const { breed, age, location } = req.query;
  const q = {};
  if (breed) q.breed = breed;
  if (age) q.age = Number(age);
  if (location) q.location = location;
  const pets = await Pet.find(q);
  res.json(pets);
});

// Get single pet
router.get('/:id', async (req, res) => {
  const pet = await Pet.findById(req.params.id);
  if (!pet) return res.status(404).json({ error: 'Not found' });
  res.json(pet);
});

// Update pet
router.put('/:id', auth('shelter'), upload.single('image'), async (req, res) => {
  const pet = await Pet.findById(req.params.id);
  if (!pet) return res.status(404).json({ error: 'Not found' });
  if (String(pet.shelter) !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Forbidden' });
  if (req.file) req.body.imageURL = `/image/${req.file.id}`;
  Object.assign(pet, req.body);
  await pet.save();
  res.json(pet);
});

// Delete pet
router.delete('/:id', auth('shelter'), async (req, res) => {
  const pet = await Pet.findById(req.params.id);
  if (!pet) return res.status(404).json({ error: 'Not found' });
  if (String(pet.shelter) !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Forbidden' });
  await pet.deleteOne();
  res.sendStatus(204);
});

module.exports = router;