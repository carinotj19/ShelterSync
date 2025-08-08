import * as yup from 'yup';

// Common validation rules
const requiredString = yup.string().required('This field is required');
const optionalString = yup.string();
const requiredEmail = yup
  .string()
  .email('Please enter a valid email address')
  .required('Email is required');

const strongPassword = yup
  .string()
  .min(8, 'Password must be at least 8 characters')
  .matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  )
  .required('Password is required');

const phoneNumber = yup
  .string()
  .matches(/^\+?[\d\s()-]+$/, 'Please enter a valid phone number')
  .test('min-length', 'Phone number must be at least 10 digits', (value) => {
    if (!value) return true; // Let required() handle empty values
    return value.replace(/\D/g, '').length >= 10;
  });

// User validation schemas
export const loginSchema = yup.object({
  email: requiredEmail,
  password: yup.string().required('Password is required'),
});

export const signupSchema = yup.object({
  name: requiredString.min(2, 'Name must be at least 2 characters'),
  email: requiredEmail,
  password: strongPassword,
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
  role: yup
    .string()
    .oneOf(['adopter', 'shelter'], 'Please select a valid role')
    .required('Role is required'),
  location: optionalString,
  phone: phoneNumber,
  agreeToTerms: yup
    .boolean()
    .oneOf([true], 'You must agree to the terms and conditions'),
});

export const profileUpdateSchema = yup.object({
  name: requiredString.min(2, 'Name must be at least 2 characters'),
  email: requiredEmail,
  location: optionalString,
  phone: phoneNumber,
  bio: yup.string().max(500, 'Bio must be less than 500 characters'),
});

export const changePasswordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: strongPassword,
  confirmNewPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your new password'),
});

export const forgotPasswordSchema = yup.object({
  email: requiredEmail,
});

export const resetPasswordSchema = yup.object({
  password: strongPassword,
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

// Pet validation schemas
export const petSchema = yup.object({
  name: requiredString.min(2, 'Pet name must be at least 2 characters'),
  breed: requiredString,
  age: yup
    .number()
    .positive('Age must be a positive number')
    .max(30, 'Age seems too high')
    .required('Age is required'),
  size: yup
    .string()
    .oneOf(['small', 'medium', 'large', 'extra-large'], 'Please select a valid size')
    .required('Size is required'),
  gender: yup
    .string()
    .oneOf(['male', 'female'], 'Please select a valid gender')
    .required('Gender is required'),
  color: optionalString,
  weight: yup
    .number()
    .positive('Weight must be a positive number')
    .max(200, 'Weight seems too high'),
  location: requiredString,
  description: yup
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters')
    .required('Description is required'),
  healthNotes: yup.string().max(500, 'Health notes must be less than 500 characters'),
  energy: yup
    .string()
    .oneOf(['low', 'medium', 'high'], 'Please select a valid energy level'),
  vaccinated: yup.boolean(),
  spayedNeutered: yup.boolean(),
  houseTrained: yup.boolean(),
  goodWithKids: yup.boolean(),
  goodWithPets: yup.boolean(),
  specialNeeds: yup.boolean(),
  adoptionFee: yup
    .number()
    .min(0, 'Adoption fee cannot be negative')
    .max(10000, 'Adoption fee seems too high'),
});

export const petSearchSchema = yup.object({
  search: optionalString,
  breed: optionalString,
  size: yup.string().oneOf(['', 'small', 'medium', 'large', 'extra-large']),
  age: yup.string().oneOf(['', 'young', 'adult', 'senior']),
  gender: yup.string().oneOf(['', 'male', 'female']),
  location: optionalString,
  energy: yup.string().oneOf(['', 'low', 'medium', 'high']),
  goodWithKids: yup.boolean(),
  goodWithPets: yup.boolean(),
  vaccinated: yup.boolean(),
  spayedNeutered: yup.boolean(),
});

// Adoption request validation schemas
export const adoptionRequestSchema = yup.object({
  message: yup
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must be less than 1000 characters')
    .required('Please tell us why you want to adopt this pet'),
  adopterInfo: yup.object({
    experience: optionalString.max(500, 'Experience must be less than 500 characters'),
    livingSpace: yup
      .string()
      .oneOf(['apartment', 'house', 'farm', 'other'], 'Please select your living space type'),
    hasYard: yup.boolean(),
    hasOtherPets: yup.boolean(),
    otherPetsDetails: yup.string().when('hasOtherPets', {
      is: true,
      then: (schema) => schema.required('Please provide details about your other pets'),
      otherwise: (schema) => schema,
    }),
    workSchedule: optionalString.max(200, 'Work schedule must be less than 200 characters'),
    references: yup.array().of(
      yup.object({
        name: requiredString,
        phone: phoneNumber.required('Reference phone is required'),
        relationship: requiredString,
      })
    ),
  }),
});

export const adoptionResponseSchema = yup.object({
  response: yup
    .string()
    .max(1000, 'Response must be less than 1000 characters')
    .required('Please provide a response'),
});

export const adoptionNoteSchema = yup.object({
  content: yup
    .string()
    .min(1, 'Note cannot be empty')
    .max(500, 'Note must be less than 500 characters')
    .required('Note content is required'),
});

// Contact form validation schema
export const contactSchema = yup.object({
  name: requiredString.min(2, 'Name must be at least 2 characters'),
  email: requiredEmail,
  subject: requiredString.min(5, 'Subject must be at least 5 characters'),
  message: yup
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must be less than 1000 characters')
    .required('Message is required'),
});

// File upload validation
export const imageUploadSchema = yup.object({
  file: yup
    .mixed()
    .required('Please select an image')
    .test('fileSize', 'File size must be less than 5MB', (value) => {
      return value && value.size <= 5 * 1024 * 1024;
    })
    .test('fileType', 'Only image files are allowed', (value) => {
      return value && ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(value.type);
    }),
});

// Custom validation functions
export const validateAge = (birthDate) => {
  if (!birthDate) return false;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  
  return age >= 18;
};

export const validateFileSize = (file, maxSizeInMB = 5) => {
  if (!file) return false;
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
};

export const validateImageDimensions = (file, maxWidth = 2000, maxHeight = 2000) => {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) {
      resolve(false);
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      resolve(img.width <= maxWidth && img.height <= maxHeight);
    };
    img.onerror = () => resolve(false);
    img.src = URL.createObjectURL(file);
  });
};

// Form validation helpers
export const getFieldError = (errors, touched, fieldName) => {
  return errors[fieldName] && touched[fieldName] ? errors[fieldName] : null;
};

export const hasFieldError = (errors, touched, fieldName) => {
  return !!(errors[fieldName] && touched[fieldName]);
};

export const getFieldProps = (formik, fieldName) => {
  return {
    name: fieldName,
    value: formik.values[fieldName] || '',
    onChange: formik.handleChange,
    onBlur: formik.handleBlur,
    error: hasFieldError(formik.errors, formik.touched, fieldName),
    helperText: getFieldError(formik.errors, formik.touched, fieldName),
  };
};

// Validation error messages
export const errorMessages = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  minLength: (min) => `Must be at least ${min} characters`,
  maxLength: (max) => `Must be less than ${max} characters`,
  passwordStrength: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  passwordMatch: 'Passwords must match',
  phoneNumber: 'Please enter a valid phone number',
  fileSize: (maxSize) => `File size must be less than ${maxSize}MB`,
  fileType: 'Invalid file type',
  positiveNumber: 'Must be a positive number',
  invalidSelection: 'Please select a valid option',
};

// Validation utilities
export const createValidationSchema = (fields) => {
  const schemaFields = {};
  
  fields.forEach(field => {
    const { name, type, required, min, max, options } = field;
    let validator;
    
    switch (type) {
      case 'email':
        validator = required ? requiredEmail : yup.string().email();
        break;
      case 'password':
        validator = required ? strongPassword : yup.string();
        break;
      case 'phone':
        validator = required ? phoneNumber.required() : phoneNumber;
        break;
      case 'number':
        validator = yup.number();
        if (required) validator = validator.required();
        if (min !== undefined) validator = validator.min(min);
        if (max !== undefined) validator = validator.max(max);
        break;
      case 'select':
        validator = yup.string();
        if (options) validator = validator.oneOf(options);
        if (required) validator = validator.required();
        break;
      default:
        validator = required ? requiredString : optionalString;
        if (min !== undefined) validator = validator.min(min);
        if (max !== undefined) validator = validator.max(max);
    }
    
    schemaFields[name] = validator;
  });
  
  return yup.object(schemaFields);
};

const validationSchemas = {
  loginSchema,
  signupSchema,
  profileUpdateSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  petSchema,
  petSearchSchema,
  adoptionRequestSchema,
  adoptionResponseSchema,
  adoptionNoteSchema,
  contactSchema,
  imageUploadSchema,
  validateAge,
  validateFileSize,
  validateImageDimensions,
  getFieldError,
  hasFieldError,
  getFieldProps,
  errorMessages,
  createValidationSchema,
};

export default validationSchemas;