// This script seeds the MongoDB database with realistic sample data.
//
// It reads configuration from environment variables via the existing config
// module (./config/config.js). The connection URI defined in the `.env` file
// (MONGO_URI) should point at your MongoDB Atlas cluster.  If you leave
// MONGO_URI unset, seeding will fail.
//
// You can optionally override the number of shelters, adopters, admins,
// pets per shelter and requests per adopter via environment variables
// SEED_SHELTERS, SEED_ADOPTERS, SEED_ADMINS, SEED_PETS_PER_SHELTER and
// SEED_REQUESTS_PER_ADOPTER respectively.  If these are not provided,
// sensible defaults are used.

require('dotenv').config();

const mongoose = require('mongoose');
const { Types } = mongoose;
const config = require('../config/config');
const User = require('../models/User');
const Pet = require('../models/Pet');
const AdoptionRequest = require('../models/AdoptionRequest');

// Determine counts either from environment or fallback defaults.
const NUM_SHELTERS = Number(process.env.SEED_SHELTERS) || 5;
const NUM_ADOPTERS = Number(process.env.SEED_ADOPTERS) || 10;
const NUM_ADMINS = Number(process.env.SEED_ADMINS) || 2;
const PETS_PER_SHELTER = Number(process.env.SEED_PETS_PER_SHELTER) || 8;
const REQUESTS_PER_ADOPTER = Number(process.env.SEED_REQUESTS_PER_ADOPTER) || 2;

// A small selection of pet names and breeds used when generating sample pets.
const PET_NAMES = [
  'Buddy', 'Max', 'Luna', 'Milo', 'Daisy', 'Bella', 'Charlie', 'Rocky', 'Molly', 'Bailey',
  'Coco', 'Rex', 'Lucy', 'Shadow', 'Pepper', 'Simba', 'Nala', 'Oscar', 'Rosie', 'Toby'
];
const BREEDS = [
  'Labrador Retriever', 'Beagle', 'Poodle', 'Bulldog', 'German Shepherd',
  'Siamese Cat', 'Domestic Shorthair', 'Boxer', 'Persian Cat', 'Chihuahua'
];
// Possible statuses for adoption requests.
const STATUSES = ['pending', 'approved', 'rejected', 'withdrawn'];

// Possible statuses for pets themselves so the UI can demonstrate all cases.
const PET_STATUSES = ['available', 'pending', 'adopted'];

async function seed() {
  console.log('Starting database seed...');

  // Attempt to connect to the database.  The config module will throw if
  // required environment variables (such as MONGO_URI) are missing.
  await mongoose.connect(config.mongoose.url, config.mongoose.options);
  console.log(`Connected to MongoDB at ${config.mongoose.url}`);

  try {
    // Clear existing data to avoid duplicate entries on subsequent runs.
    await Promise.all([
      User.deleteMany({}),
      Pet.deleteMany({}),
      AdoptionRequest.deleteMany({})
    ]);
    console.log('Existing collections cleared');

    // Generate shelter users.
    const shelters = [];
    for (let i = 0; i < NUM_SHELTERS; i++) {
      shelters.push({
        _id: new Types.ObjectId(),
        name: `Shelter ${i + 1}`,
        email: `shelter${i + 1}@example.com`,
        password: 'password123',
        role: 'shelter',
        location: `City ${i + 1}`
      });
    }

    // Generate adopter users.
    const adopters = [];
    for (let i = 0; i < NUM_ADOPTERS; i++) {
      adopters.push({
        _id: new Types.ObjectId(),
        name: `Adopter ${i + 1}`,
        email: `adopter${i + 1}@example.com`,
        password: 'password123',
        role: 'adopter',
        location: `Town ${i + 1}`
      });
    }

    // Generate admin users.
    const admins = [];
    for (let i = 0; i < NUM_ADMINS; i++) {
      admins.push({
        _id: new Types.ObjectId(),
        name: `Admin ${i + 1}`,
        email: `admin${i + 1}@example.com`,
        password: 'password123',
        role: 'admin',
        location: 'HQ'
      });
    }

    const users = [...shelters, ...adopters, ...admins];
    // Use `create` instead of `insertMany` so that mongoose middleware (e.g. password
    // hashing) runs on each document.
    await User.create(users);
    console.log(`${users.length} users created`);

    // Generate pets for each shelter.
    const pets = [];
    let petCounter = 0;
    for (const shelter of shelters) {
      for (let i = 0; i < PETS_PER_SHELTER; i++) {
        const name = PET_NAMES[petCounter % PET_NAMES.length];
        const breed = BREEDS[petCounter % BREEDS.length];
        const age = Math.floor(Math.random() * 10) + 1; // random age between 1 and 10
        pets.push({
          _id: new Types.ObjectId(),
          name,
          breed,
          age,
          shelter: shelter._id,
          location: shelter.location,
          vaccinated: Math.random() < 0.7,
          spayedNeutered: Math.random() < 0.6,
          houseTrained: Math.random() < 0.5,
          goodWithKids: Math.random() < 0.5,
          goodWithPets: Math.random() < 0.5,
          status: PET_STATUSES[Math.floor(Math.random() * PET_STATUSES.length)]
        });
        petCounter++;
      }
    }
    await Pet.create(pets);
    console.log(`${pets.length} pets created`);

    // Generate adoption requests for each adopter.  Pick random pets and random statuses.
    const adoptionRequests = [];
    for (const adopter of adopters) {
      for (let i = 0; i < REQUESTS_PER_ADOPTER; i++) {
        const pet = pets[Math.floor(Math.random() * pets.length)];
        const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
        adoptionRequests.push({
          pet: pet._id,
          adopter: adopter._id,
          shelter: pet.shelter,
          message: `Hi, I would love to adopt ${pet.name}. I have a big yard and experience with pets.`,
          status
        });
      }
    }
    await AdoptionRequest.create(adoptionRequests);
    console.log(`${adoptionRequests.length} adoption requests created`);

    console.log('Database seeded with sample data');
  } catch (err) {
    // Log the error and rethrow so the process exits with a failure code.
    console.error('Error seeding data:', err);
    throw err;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seed().catch(() => process.exit(1));
