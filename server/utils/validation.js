const Joi = require('joi');

// User validation schemas
const userSignupSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 50 characters',
      'any.required': 'Name is required'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),
  role: Joi.string()
    .valid('adopter', 'shelter', 'admin')
    .default('adopter')
    .messages({
      'any.only': 'Role must be either adopter, shelter, or admin'
    }),
  location: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Location must be at least 2 characters long',
      'string.max': 'Location cannot exceed 100 characters'
    })
});

const userLoginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

// Pet validation schemas
const petCreateSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.min': 'Pet name is required',
      'string.max': 'Pet name cannot exceed 50 characters',
      'any.required': 'Pet name is required'
    }),
  breed: Joi.string()
    .min(2)
    .max(50)
    .optional()
    .messages({
      'string.min': 'Breed must be at least 2 characters long',
      'string.max': 'Breed cannot exceed 50 characters'
    }),
  age: Joi.number()
    .integer()
    .min(0)
    .max(30)
    .optional()
    .messages({
      'number.base': 'Age must be a number',
      'number.integer': 'Age must be a whole number',
      'number.min': 'Age cannot be negative',
      'number.max': 'Age cannot exceed 30 years'
    }),
  healthNotes: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Health notes cannot exceed 500 characters'
    }),
  location: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Location must be at least 2 characters long',
      'string.max': 'Location cannot exceed 100 characters'
    })
});

const petUpdateSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(50)
    .optional()
    .messages({
      'string.min': 'Pet name cannot be empty',
      'string.max': 'Pet name cannot exceed 50 characters'
    }),
  breed: Joi.string()
    .min(2)
    .max(50)
    .optional()
    .messages({
      'string.min': 'Breed must be at least 2 characters long',
      'string.max': 'Breed cannot exceed 50 characters'
    }),
  age: Joi.number()
    .integer()
    .min(0)
    .max(30)
    .optional()
    .messages({
      'number.base': 'Age must be a number',
      'number.integer': 'Age must be a whole number',
      'number.min': 'Age cannot be negative',
      'number.max': 'Age cannot exceed 30 years'
    }),
  healthNotes: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Health notes cannot exceed 500 characters'
    }),
  location: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Location must be at least 2 characters long',
      'string.max': 'Location cannot exceed 100 characters'
    })
});

// Adoption request validation schema
const adoptionRequestSchema = Joi.object({
  message: Joi.string()
    .min(10)
    .max(1000)
    .required()
    .messages({
      'string.min': 'Message must be at least 10 characters long',
      'string.max': 'Message cannot exceed 1000 characters',
      'any.required': 'Message is required'
    })
});

// Query parameter validation schemas
const petQuerySchema = Joi.object({
  breed: Joi.string().optional(),
  age: Joi.number().integer().min(0).max(30).optional(),
  location: Joi.string().optional(),
  search: Joi.string().optional(),
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(10).optional()
});

// Validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        status: 'fail',
        message: 'Validation error',
        errors: errorMessage
      });
    }

    req[property] = value;
    next();
  };
};

module.exports = {
  userSignupSchema,
  userLoginSchema,
  petCreateSchema,
  petUpdateSchema,
  adoptionRequestSchema,
  petQuerySchema,
  validate
};
