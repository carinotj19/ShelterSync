const Joi = require('joi');

// Define configuration schema
const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(5000),
  MONGO_URI: Joi.string().required().description('MongoDB connection string'),
  JWT_SECRET: Joi.string().min(32).required().description('JWT secret key'),
  JWT_EXPIRES_IN: Joi.string().default('7d').description('JWT expiration time'),
  EMAIL_SERVICE: Joi.string().default('gmail').description('Email service provider'),
  EMAIL_USER: Joi.string().email().allow('').optional().description('Email username'),
  EMAIL_PASS: Joi.string().allow('').optional().description('Email password'),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'http', 'debug')
    .default('info'),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000).description('Rate limit window in ms'),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100).description('Max requests per window'),
  BCRYPT_ROUNDS: Joi.number().default(12).description('Bcrypt salt rounds'),
  MAX_FILE_SIZE: Joi.number().default(5242880).description('Max file size in bytes (5MB)'),
  ALLOWED_FILE_TYPES: Joi.string().default('image/jpeg,image/png,image/gif').description('Allowed file MIME types')
}).unknown();

// Validate environment variables
const { error, value: envVars } = envVarsSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongoose: {
    url: envVars.MONGO_URI,
    options: {}
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    expiresIn: envVars.JWT_EXPIRES_IN
  },
  email: {
    service: envVars.EMAIL_SERVICE,
    user: envVars.EMAIL_USER,
    pass: envVars.EMAIL_PASS
  },
  logging: {
    level: envVars.LOG_LEVEL
  },
  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    max: envVars.RATE_LIMIT_MAX_REQUESTS
  },
  bcrypt: {
    rounds: envVars.BCRYPT_ROUNDS
  },
  upload: {
    maxFileSize: envVars.MAX_FILE_SIZE,
    allowedTypes: envVars.ALLOWED_FILE_TYPES.split(',')
  }
};

module.exports = config;
