const router = require('express').Router();
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const PetService = require('../services/PetService');
const { catchAsync } = require('../middleware/errorHandler');
const { validate, petCreateSchema, petUpdateSchema, petQuerySchema } = require('../utils/validation');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/security');
const config = require('../config/config');
const logger = require('../utils/logger');

// Configure GridFS storage for file uploads
const storage = new GridFsStorage({
  url: config.mongoose.url,
  options: config.mongoose.options,
  file: (req, file) => {
    // Validate file type
    if (!config.upload.allowedTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only images are allowed.');
    }

    return {
      filename: `${Date.now()}-${file.originalname}`,
      bucketName: 'uploads'
    };
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxFileSize
  },
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'), false);
    }
  }
});

// Get all pets with filtering, search, and pagination
router.get('/',
  validate(petQuerySchema, 'query'),
  catchAsync(async (req, res) => {
    const { page, limit, search, ...filters } = req.query;

    const result = await PetService.getPets(
      filters,
      parseInt(page) || 1,
      parseInt(limit) || 10,
      search || ''
    );

    res.json({
      status: 'success',
      data: {
        pets: result.pets,
        pagination: result.pagination
      }
    });
  })
);

// Get featured pets
router.get('/featured',
  catchAsync(async (req, res) => {
    const limit = parseInt(req.query.limit) || 6;
    const pets = await PetService.getFeaturedPets(limit);

    res.json({
      status: 'success',
      data: {
        pets
      }
    });
  })
);

// Get pet statistics
router.get('/statistics',
  authenticate,
  catchAsync(async (req, res) => {
    const shelterId = req.user.role === 'shelter' ? req.user._id : null;
    const stats = await PetService.getPetStatistics(shelterId);

    res.json({
      status: 'success',
      data: {
        statistics: stats
      }
    });
  })
);

// Get pets by shelter
router.get('/shelter/:shelterId',
  catchAsync(async (req, res) => {
    const { shelterId } = req.params;
    const { page, limit, status } = req.query;

    const result = await PetService.getPetsByShelter(
      shelterId,
      parseInt(page) || 1,
      parseInt(limit) || 10,
      status
    );

    res.json({
      status: 'success',
      data: {
        pets: result.pets,
        pagination: result.pagination
      }
    });
  })
);

// Get single pet by ID
router.get('/:id',
  catchAsync(async (req, res) => {
    const pet = await PetService.getPetById(req.params.id);

    res.json({
      status: 'success',
      data: {
        pet
      }
    });
  })
);

// Create new pet (shelter only)
router.post('/',
  authenticate,
  authorize('shelter', 'admin'),
  uploadLimiter,
  upload.single('image'),
  validate(petCreateSchema),
  catchAsync(async (req, res) => {
    const pet = await PetService.createPet(
      req.body,
      req.user._id,
      req.file
    );

    logger.info('Pet created successfully', {
      petId: pet._id,
      shelterId: req.user._id,
      petName: pet.name
    });

    res.status(201).json({
      status: 'success',
      message: 'Pet created successfully',
      data: {
        pet
      }
    });
  })
);

// Update pet
router.put('/:id',
  authenticate,
  authorize('shelter', 'admin'),
  uploadLimiter,
  upload.single('image'),
  validate(petUpdateSchema),
  catchAsync(async (req, res) => {
    const pet = await PetService.updatePet(
      req.params.id,
      req.body,
      req.user._id,
      req.user.role,
      req.file
    );

    logger.info('Pet updated successfully', {
      petId: req.params.id,
      userId: req.user._id
    });

    res.json({
      status: 'success',
      message: 'Pet updated successfully',
      data: {
        pet
      }
    });
  })
);

// Toggle featured status
router.patch('/:id/featured',
  authenticate,
  authorize('shelter', 'admin'),
  catchAsync(async (req, res) => {
    const pet = await PetService.toggleFeatured(
      req.params.id,
      req.user._id,
      req.user.role
    );

    logger.info('Pet featured status toggled', {
      petId: req.params.id,
      featured: pet.featured,
      userId: req.user._id
    });

    res.json({
      status: 'success',
      message: `Pet ${pet.featured ? 'featured' : 'unfeatured'} successfully`,
      data: {
        pet
      }
    });
  })
);

// Mark pet as adopted
router.patch('/:id/adopt',
  authenticate,
  authorize('shelter', 'admin'),
  catchAsync(async (req, res) => {
    const { adopterId } = req.body;

    if (!adopterId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Adopter ID is required'
      });
    }

    const pet = await PetService.markAsAdopted(
      req.params.id,
      adopterId,
      req.user._id,
      req.user.role
    );

    logger.info('Pet marked as adopted', {
      petId: req.params.id,
      adopterId,
      shelterId: req.user._id
    });

    res.json({
      status: 'success',
      message: 'Pet marked as adopted successfully',
      data: {
        pet
      }
    });
  })
);

// Delete pet
router.delete('/:id',
  authenticate,
  authorize('shelter', 'admin'),
  catchAsync(async (req, res) => {
    await PetService.deletePet(
      req.params.id,
      req.user._id,
      req.user.role
    );

    logger.info('Pet deleted successfully', {
      petId: req.params.id,
      userId: req.user._id
    });

    res.json({
      status: 'success',
      message: 'Pet deleted successfully'
    });
  })
);

// Error handling for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'fail',
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    return res.status(400).json({
      status: 'fail',
      message: 'File upload error: ' + error.message
    });
  }

  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }

  next(error);
});

module.exports = router;
