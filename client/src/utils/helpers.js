/* eslint-disable no-console */
import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

// Date formatting utilities
export const formatDate = (date, formatString = 'MMM dd, yyyy') => {
  if (!date) return '';
  
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(parsedDate)) return '';
  
  return format(parsedDate, formatString);
};

export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(parsedDate)) return '';
  
  return formatDistanceToNow(parsedDate, { addSuffix: true });
};

// String utilities
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

export const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

// Validation utilities
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s()-]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

export const isStrongPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongPasswordRegex.test(password);
};

// File utilities
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const isValidImageFile = (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type);
};

export const resizeImage = (file, maxWidth = 800, maxHeight = 600, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(resolve, file.type, quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Array utilities
export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key];
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
};

export const sortBy = (array, key, direction = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

export const removeDuplicates = (array, key) => {
  if (!key) return [...new Set(array)];
  
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
};

// URL utilities
export const buildQueryString = (params) => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, v));
      } else {
        searchParams.append(key, value);
      }
    }
  });
  
  return searchParams.toString();
};

export const parseQueryString = (queryString) => {
  const params = new URLSearchParams(queryString);
  const result = {};
  
  for (const [key, value] of params.entries()) {
    if (result[key]) {
      if (Array.isArray(result[key])) {
        result[key].push(value);
      } else {
        result[key] = [result[key], value];
      }
    } else {
      result[key] = value;
    }
  }
  
  return result;
};

// Local storage utilities
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading from localStorage key "${key}":`, error);
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error writing to localStorage key "${key}":`, error);
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.warn('Error clearing localStorage:', error);
    }
  }
};

// Debounce utility
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
};

// Throttle utility
export const throttle = (func, limit) => {
  let inThrottle;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Color utilities
export const getContrastColor = (hexColor) => {
  // Remove # if present
  const color = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

export const generateRandomColor = () => {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    '#F97316', '#6366F1', '#14B8A6', '#F43F5E'
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
};

// Form utilities
export const getFormData = (form) => {
  const formData = new FormData(form);
  const data = {};
  
  for (const [key, value] of formData.entries()) {
    if (data[key]) {
      if (Array.isArray(data[key])) {
        data[key].push(value);
      } else {
        data[key] = [data[key], value];
      }
    } else {
      data[key] = value;
    }
  }
  
  return data;
};

export const resetForm = (form) => {
  if (form && typeof form.reset === 'function') {
    form.reset();
  }
};

// Error handling utilities
export const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.data?.errors) return error.response.data.errors;
  if (error?.message) return error.message;
  return 'An unexpected error occurred';
};

export const logError = (error, context = '') => {
  console.error(`Error ${context}:`, error);
  
  // In production, you might want to send errors to a logging service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to error tracking service
    // errorTrackingService.captureException(error, { context });
  }
};

// Performance utilities
export const measurePerformance = (name, fn) => {
  return async (...args) => {
    const start = performance.now();
    const result = await fn(...args);
    const end = performance.now();
    
    console.log(`${name} took ${end - start} milliseconds`);
    return result;
  };
};

// Accessibility utilities
export const announceToScreenReader = (message) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

export const trapFocus = (element) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  const handleTabKey = (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
  };
  
  element.addEventListener('keydown', handleTabKey);
  
  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
};
