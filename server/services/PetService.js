const Pet = require('../models/Pet');
const { ValidationError, NotFoundError, AuthorizationError } = require('../utils/errors');
const logger = require('../utils/logger');

class PetService {
  // Create a new pet
  static async createPet(petData, shelterId, imageFile = null) {
    try {
      const petInfo = {
        ...petData,
        shelter: shelterId
      };

      // Add image URL if file was uploaded
      if (imageFile) {
        petInfo.imageURL = `/image/${imageFile.id}`;
      }

      const pet = await Pet.create(petInfo);
      await pet.populate('shelter', 'name location');

      logger.info('Pet created successfully', {
        petId: pet._id,
        shelterId,
        petName: pet.name
      });

      return pet;
    } catch (error) {
      logger.error('Failed to create pet', { error: error.message, shelterId });
      throw error;
    }
  }

  // Get all pets with filtering and pagination
  static async getPets(filters = {}, page = 1, limit = 10, search = '') {
    try {
      const skip = (page - 1) * limit;
      const query = { status: 'available' };

      // Apply filters
      if (filters.breed) {
        query.breed = new RegExp(filters.breed, 'i');
      }
      if (filters.age) {
        query.age = parseInt(filters.age);
      }
      if (filters.location) {
        query.location = new RegExp(filters.location, 'i');
      }
      if (filters.size) {
        query.size = filters.size;
      }
      if (filters.energy) {
        query.energy = filters.energy;
      }
      if (filters.vaccinated !== undefined) {
        query.vaccinated = filters.vaccinated === 'true';
      }
      if (filters.spayedNeutered !== undefined) {
        query.spayedNeutered = filters.spayedNeutered === 'true';
      }
      if (filters.goodWithKids !== undefined) {
        query.goodWithKids = filters.goodWithKids === 'true';
      }
      if (filters.goodWithPets !== undefined) {
        query.goodWithPets = filters.goodWithPets === 'true';
      }

      let petsQuery;

      // Use text search if search term provided
      if (search) {
        petsQuery = Pet.search(search, query);
      } else {
        petsQuery = Pet.find(query)
          .populate('shelter', 'name location')
          .sort({ featured: -1, createdAt: -1 });
      }

      const pets = await petsQuery.skip(skip).limit(limit);
      const total = await Pet.countDocuments(search ? { ...query, $text: { $search: search } } : query);

      logger.info('Pets retrieved successfully', {
        count: pets.length,
        total,
        page,
        search: search || 'none'
      });

      return {
        pets,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to retrieve pets', { error: error.message, filters });
      throw error;
    }
  }

  // Get pet by ID
  static async getPetById(petId) {
    try {
      const pet = await Pet.findById(petId).populate('shelter', 'name email location');

      if (!pet) {
        throw new NotFoundError('Pet not found');
      }

      logger.info('Pet retrieved successfully', { petId });
      return pet;
    } catch (error) {
      if (error.name === 'CastError') {
        throw new NotFoundError('Pet not found');
      }
      throw error;
    }
  }

  // Update pet
  static async updatePet(petId, updateData, userId, userRole, imageFile = null) {
    try {
      const pet = await Pet.findById(petId);

      if (!pet) {
        throw new NotFoundError('Pet not found');
      }

      // Check ownership (shelter can only update their own pets, admin can update any)
      if (userRole !== 'admin' && pet.shelter.toString() !== userId) {
        throw new AuthorizationError('You can only update your own pets');
      }

      // Add image URL if new file was uploaded
      if (imageFile) {
        updateData.imageURL = `/image/${imageFile.id}`;
      }

      // Update pet
      Object.assign(pet, updateData);
      await pet.save();
      await pet.populate('shelter', 'name location');

      logger.info('Pet updated successfully', {
        petId,
        userId,
        updatedFields: Object.keys(updateData)
      });

      return pet;
    } catch (error) {
      if (error.name === 'CastError') {
        throw new NotFoundError('Pet not found');
      }
      throw error;
    }
  }

  // Delete pet
  static async deletePet(petId, userId, userRole) {
    try {
      const pet = await Pet.findById(petId);

      if (!pet) {
        throw new NotFoundError('Pet not found');
      }

      // Check ownership (shelter can only delete their own pets, admin can delete any)
      if (userRole !== 'admin' && pet.shelter.toString() !== userId) {
        throw new AuthorizationError('You can only delete your own pets');
      }

      // Check if pet can be deleted (not if there are pending adoption requests)
      if (pet.status === 'pending') {
        throw new ValidationError('Cannot delete pet with pending adoption requests');
      }

      await pet.deleteOne();

      logger.info('Pet deleted successfully', { petId, userId });
      return { message: 'Pet deleted successfully' };
    } catch (error) {
      if (error.name === 'CastError') {
        throw new NotFoundError('Pet not found');
      }
      throw error;
    }
  }

  // Get pets by shelter
  static async getPetsByShelter(shelterId, page = 1, limit = 10, status = null) {
    try {
      const skip = (page - 1) * limit;
      const query = { shelter: shelterId };

      if (status) {
        query.status = status;
      }

      const pets = await Pet.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Pet.countDocuments(query);

      logger.info('Shelter pets retrieved successfully', {
        shelterId,
        count: pets.length,
        total
      });

      return {
        pets,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to retrieve shelter pets', { error: error.message, shelterId });
      throw error;
    }
  }

  // Mark pet as adopted
  static async markAsAdopted(petId, adopterId, userId, userRole) {
    try {
      const pet = await Pet.findById(petId);

      if (!pet) {
        throw new NotFoundError('Pet not found');
      }

      // Check ownership (shelter can only update their own pets, admin can update any)
      if (userRole !== 'admin' && pet.shelter.toString() !== userId) {
        throw new AuthorizationError('You can only update your own pets');
      }

      if (!pet.canBeAdopted()) {
        throw new ValidationError('Pet is not available for adoption');
      }

      await pet.markAsAdopted(adopterId);

      logger.info('Pet marked as adopted', { petId, adopterId, userId });
      return pet;
    } catch (error) {
      if (error.name === 'CastError') {
        throw new NotFoundError('Pet not found');
      }
      throw error;
    }
  }

  // Get featured pets
  static async getFeaturedPets(limit = 6) {
    try {
      const pets = await Pet.find({
        status: 'available',
        featured: true
      })
        .populate('shelter', 'name location')
        .sort({ createdAt: -1 })
        .limit(limit);

      logger.info('Featured pets retrieved successfully', { count: pets.length });
      return pets;
    } catch (error) {
      logger.error('Failed to retrieve featured pets', { error: error.message });
      throw error;
    }
  }

  // Toggle featured status
  static async toggleFeatured(petId, userId, userRole) {
    try {
      const pet = await Pet.findById(petId);

      if (!pet) {
        throw new NotFoundError('Pet not found');
      }

      // Check ownership (shelter can only update their own pets, admin can update any)
      if (userRole !== 'admin' && pet.shelter.toString() !== userId) {
        throw new AuthorizationError('You can only update your own pets');
      }

      pet.featured = !pet.featured;
      await pet.save();

      logger.info('Pet featured status toggled', {
        petId,
        userId,
        featured: pet.featured
      });

      return pet;
    } catch (error) {
      if (error.name === 'CastError') {
        throw new NotFoundError('Pet not found');
      }
      throw error;
    }
  }

  // Get pet statistics
  static async getPetStatistics(shelterId = null) {
    try {
      const matchStage = shelterId ? { shelter: shelterId } : {};

      const stats = await Pet.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            available: {
              $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] }
            },
            pending: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            adopted: {
              $sum: { $cond: [{ $eq: ['$status', 'adopted'] }, 1, 0] }
            },
            featured: {
              $sum: { $cond: ['$featured', 1, 0] }
            }
          }
        }
      ]);

      const result = stats[0] || {
        total: 0,
        available: 0,
        pending: 0,
        adopted: 0,
        featured: 0
      };

      logger.info('Pet statistics retrieved', { shelterId, stats: result });
      return result;
    } catch (error) {
      logger.error('Failed to retrieve pet statistics', { error: error.message, shelterId });
      throw error;
    }
  }
}

module.exports = PetService;
