require('dotenv').config();
const mongoose = require('mongoose');
const { Types } = mongoose;
const config = require('./config/config');
const User = require('./models/User');
const Pet = require('./models/Pet');
const AdoptionRequest = require('./models/AdoptionRequest');

const NUM_SHELTERS = 5;
const NUM_ADOPTERS = 10;
const NUM_ADMINS = 2;
const PETS_PER_SHELTER = 8;
const REQUESTS_PER_ADOPTER = 2;

const petNames = [
  'Buddy','Max','Luna','Milo','Daisy','Bella','Charlie','Rocky','Molly','Bailey',
  'Coco','Rex','Lucy','Shadow','Pepper','Simba','Nala','Oscar','Rosie','Toby'
];

const breeds = [
  'Labrador Retriever','Beagle','Poodle','Bulldog','German Shepherd',
  'Siamese Cat','Domestic Shorthair','Boxer','Persian Cat','Chihuahua'
];

async function seed() {
  await mongoose.connect(config.mongoose.url, config.mongoose.options);

  await Promise.all([
    User.deleteMany({}),
    Pet.deleteMany({}),
    AdoptionRequest.deleteMany({})
  ]);

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
  await User.create(users);

  const pets = [];
  let petCounter = 0;
  for (const shelter of shelters) {
    for (let i = 0; i < PETS_PER_SHELTER; i++) {
      const name = petNames[petCounter % petNames.length];
      const breed = breeds[petCounter % breeds.length];
      const age = Math.floor(Math.random() * 10) + 1;
      pets.push({
        _id: new Types.ObjectId(),
        name,
        breed,
        age,
        shelter: shelter._id,
        location: shelter.location,
        vaccinated: Math.random() < 0.7,
        spayedNeutered: Math.random() < 0.6,
        goodWithKids: Math.random() < 0.5,
        goodWithPets: Math.random() < 0.5,
        status: 'available'
      });
      petCounter++;
    }
  }
  await Pet.create(pets);

  const statuses = ['pending', 'approved', 'rejected', 'withdrawn'];
  const adoptionRequests = [];
  for (const adopter of adopters) {
    for (let i = 0; i < REQUESTS_PER_ADOPTER; i++) {
      const pet = pets[Math.floor(Math.random() * pets.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
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

  console.log('Database seeded with sample data');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
