const mongoose = require('mongoose');

const adoptionRequestSchema = new mongoose.Schema({
  pet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: [true, 'Pet reference is required']
  },
  adopter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Adopter reference is required']
  },
  shelter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Shelter reference is required']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    minlength: [10, 'Message must be at least 10 characters long'],
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'approved', 'rejected', 'withdrawn'],
      message: 'Status must be pending, approved, rejected, or withdrawn'
    },
    default: 'pending'
  },
  shelterResponse: {
    type: String,
    trim: true,
    maxlength: [1000, 'Shelter response cannot exceed 1000 characters']
  },
  respondedAt: {
    type: Date
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  adopterInfo: {
    experience: {
      type: String,
      maxlength: [500, 'Experience description cannot exceed 500 characters']
    },
    livingSpace: {
      type: String,
      enum: ['apartment', 'house', 'farm', 'other'],
      default: 'house'
    },
    hasYard: {
      type: Boolean,
      default: false
    },
    hasOtherPets: {
      type: Boolean,
      default: false
    },
    hasChildren: {
      type: Boolean,
      default: false
    },
    workSchedule: {
      type: String,
      maxlength: [200, 'Work schedule description cannot exceed 200 characters']
    }
  },
  notes: [{
    content: {
      type: String,
      required: true,
      maxlength: [500, 'Note cannot exceed 500 characters']
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
adoptionRequestSchema.index({ pet: 1 });
adoptionRequestSchema.index({ adopter: 1 });
adoptionRequestSchema.index({ shelter: 1 });
adoptionRequestSchema.index({ status: 1 });
adoptionRequestSchema.index({ priority: -1 });
adoptionRequestSchema.index({ createdAt: -1 });

// Compound indexes
adoptionRequestSchema.index({ shelter: 1, status: 1, createdAt: -1 });
adoptionRequestSchema.index({ adopter: 1, status: 1, createdAt: -1 });

// Virtual for request age in days
adoptionRequestSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for response time in hours (if responded)
adoptionRequestSchema.virtual('responseTimeHours').get(function() {
  if (!this.respondedAt) {
    return null;
  }
  return Math.floor((this.respondedAt - this.createdAt) / (1000 * 60 * 60));
});

// Pre-save middleware
adoptionRequestSchema.pre('save', function(next) {
  // Set respondedAt when status changes from pending
  if (this.isModified('status') && this.status !== 'pending' && !this.respondedAt) {
    this.respondedAt = new Date();
  }

  // Auto-set priority based on adopter info
  if (this.isNew && this.adopterInfo) {
    let priorityScore = 0;

    if (this.adopterInfo.experience && this.adopterInfo.experience.length > 100) {
      priorityScore++;
    }
    if (this.adopterInfo.hasYard) {
      priorityScore++;
    }
    if (this.adopterInfo.livingSpace === 'house' || this.adopterInfo.livingSpace === 'farm') {
      priorityScore++;
    }

    if (priorityScore >= 2) {
      this.priority = 'high';
    } else if (priorityScore === 1) {
      this.priority = 'medium';
    } else {
      this.priority = 'low';
    }
  }

  next();
});

// Static method to get requests for a shelter
adoptionRequestSchema.statics.getForShelter = function(shelterId, status = null, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const query = { shelter: shelterId };

  if (status) {
    query.status = status;
  }

  return this.find(query)
    .populate('pet', 'name breed age imageURL')
    .populate('adopter', 'name email location')
    .sort({ priority: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get requests for an adopter
adoptionRequestSchema.statics.getForAdopter = function(adopterId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  return this.find({ adopter: adopterId })
    .populate('pet', 'name breed age imageURL')
    .populate('shelter', 'name location')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Instance method to approve request
adoptionRequestSchema.methods.approve = function(responderId, response = '') {
  this.status = 'approved';
  this.shelterResponse = response;
  this.respondedBy = responderId;
  this.respondedAt = new Date();
  return this.save();
};

// Instance method to reject request
adoptionRequestSchema.methods.reject = function(responderId, response = '') {
  this.status = 'rejected';
  this.shelterResponse = response;
  this.respondedBy = responderId;
  this.respondedAt = new Date();
  return this.save();
};

// Instance method to add note
adoptionRequestSchema.methods.addNote = function(content, userId) {
  this.notes.push({
    content,
    addedBy: userId,
    addedAt: new Date()
  });
  return this.save();
};

// Instance method to check if request can be modified
adoptionRequestSchema.methods.canBeModified = function() {
  return this.status === 'pending';
};

module.exports = mongoose.model('AdoptionRequest', adoptionRequestSchema);
