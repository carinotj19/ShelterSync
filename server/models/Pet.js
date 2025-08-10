const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Pet name is required'],
    trim: true,
    maxlength: [50, 'Pet name cannot exceed 50 characters']
  },
  breed: {
    type: String,
    trim: true,
    maxlength: [50, 'Breed cannot exceed 50 characters']
  },
  age: {
    type: Number,
    min: [0, 'Age cannot be negative'],
    max: [30, 'Age cannot exceed 30 years']
  },
  healthNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Health notes cannot exceed 500 characters']
  },
  imageURL: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  shelter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Shelter information is required']
  },
  status: {
    type: String,
    enum: {
      values: ['available', 'pending', 'adopted'],
      message: 'Status must be available, pending, or adopted'
    },
    default: 'available'
  },
  adoptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  adoptedAt: {
    type: Date
  },
  featured: {
    type: Boolean,
    default: false
  },
  vaccinated: {
    type: Boolean,
    default: false
  },
  spayedNeutered: {
    type: Boolean,
    default: false
  },
  houseTrained: {
    type: Boolean,
    default: false
  },
  goodWithKids: {
    type: Boolean,
    default: false
  },
  goodWithPets: {
    type: Boolean,
    default: false
  },
  energy: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  size: {
    type: String,
    enum: ['small', 'medium', 'large', 'extra-large'],
    default: 'medium'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance and search
petSchema.index({ shelter: 1 });
petSchema.index({ status: 1 });
petSchema.index({ breed: 1 });
petSchema.index({ location: 1 });
petSchema.index({ age: 1 });
petSchema.index({ size: 1 });
petSchema.index({ featured: -1 });
petSchema.index({ createdAt: -1 });

// Text index for search functionality
petSchema.index({
  name: 'text',
  breed: 'text',
  location: 'text',
  healthNotes: 'text'
});

// Virtual for age group
petSchema.virtual('ageGroup').get(function() {
  if (!this.age) {
    return 'unknown';
  }
  if (this.age < 1) {
    return 'puppy/kitten';
  }
  if (this.age < 3) {
    return 'young';
  }
  if (this.age < 7) {
    return 'adult';
  }
  return 'senior';
});

// Pre-save middleware
petSchema.pre('save', function(next) {
  // Set adoptedAt when status changes to adopted
  if (this.isModified('status') && this.status === 'adopted' && !this.adoptedAt) {
    this.adoptedAt = new Date();
  }

  // Clear adoptedAt and adoptedBy if status changes from adopted
  if (this.isModified('status') && this.status !== 'adopted') {
    this.adoptedAt = undefined;
    this.adoptedBy = undefined;
  }

  next();
});

// Static method for search
petSchema.statics.search = function(query, filters = {}) {
  const searchQuery = { ...filters };

  if (query) {
    searchQuery.$text = { $search: query };
  }

  return this.find(searchQuery)
    .populate('shelter', 'name location')
    .sort({ featured: -1, createdAt: -1 });
};

// Static method to get available pets with pagination
petSchema.statics.getAvailable = function(page = 1, limit = 10, filters = {}) {
  const skip = (page - 1) * limit;
  const searchQuery = { status: 'available', ...filters };

  return this.find(searchQuery)
    .populate('shelter', 'name location')
    .sort({ featured: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Instance method to check if pet can be adopted
petSchema.methods.canBeAdopted = function() {
  return this.status === 'available';
};

// Instance method to mark as adopted
petSchema.methods.markAsAdopted = function(adopterId) {
  this.status = 'adopted';
  this.adoptedBy = adopterId;
  this.adoptedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Pet', petSchema);
