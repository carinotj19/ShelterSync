import axios from 'axios';
import toast from 'react-hot-toast';
import {
  adminAPI as mockAdminAPI,
  adoptionAPI as mockAdoptionAPI,
  authAPI as mockAuthAPI,
  downloadFile as mockDownloadFile,
  healthCheck as mockHealthCheck,
  mockApiClient,
  petsAPI as mockPetsAPI,
  uploadImage as mockUploadImage,
} from './mockApi';

const USE_MOCK =
  process.env.REACT_APP_USE_MOCK === 'true' ||
  (!process.env.REACT_APP_API_URL && process.env.NODE_ENV === 'production');

let api;
let authAPI;
let petsAPI;
let adoptionAPI;
let adminAPI;
let uploadImage;
let downloadFile;
let healthCheck;

if (USE_MOCK) {
  api = mockApiClient;
  authAPI = mockAuthAPI;
  petsAPI = mockPetsAPI;
  adoptionAPI = {
    ...mockAdoptionAPI,
    // expose an explicit status helper so components don't need to branch
    updateRequestStatus: mockAdoptionAPI.updateRequestStatus,
  };
  adminAPI = mockAdminAPI;
  uploadImage = mockUploadImage;
  downloadFile = mockDownloadFile;
  healthCheck = mockHealthCheck;
} else {
  // Create axios instance with default config
  api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || '/api',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const readToken = () => {
    try {
      const raw = localStorage.getItem('auth') || sessionStorage.getItem('auth');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.token) return parsed.token;
      }
    } catch {
      // ignore JSON errors
    }
    return localStorage.getItem('token'); // legacy fallback
  };

  // Request interceptor to add auth token
  api.interceptors.request.use(
    (config) => {
      const token = readToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for error handling
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      const { response, config } = error;
      const isAuthRoute =
        config?.url?.includes('/auth/login') ||
        config?.url?.includes('/auth/signup');

      // Let login/signup pages handle errors without redirecting
      if (isAuthRoute) {
        return Promise.reject(error);
      }

      if (response) {
        const { status, data } = response;

        switch (status) {
          case 401:
            // Unauthorized - clear token and redirect to login
            localStorage.removeItem('auth');
            sessionStorage.removeItem('auth');
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            window.location.href = '/login';
            toast.error('Session expired. Please log in again.');
            break;

          case 403:
            toast.error('You do not have permission to perform this action.');
            break;

          case 404:
            toast.error('Resource not found.');
            break;

          case 429:
            toast.error('Too many requests. Please try again later.');
            break;

          case 500:
            toast.error('Server error. Please try again later.');
            break;

          default:
            if (data?.message) {
              toast.error(data.message);
            } else if (data?.errors) {
              const errorMessage = Array.isArray(data.errors)
                ? data.errors.join(', ')
                : typeof data.errors === 'object'
                  ? Object.values(data.errors).join(', ')
                  : data.errors;
              toast.error(errorMessage);
            } else {
              toast.error('An unexpected error occurred.');
            }
        }
      } else if (error.code === 'ECONNABORTED') {
        toast.error('Request timeout. Please check your connection.');
      } else if (error.message === 'Network Error') {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error('An unexpected error occurred.');
      }

      return Promise.reject(error);
    }
  );

  // API service methods (real backend)
  authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    signup: (userData) => api.post('/auth/signup', userData),
    getProfile: () => api.get('/auth/me'),
    updateProfile: (data) => api.patch('/auth/me', data),
    changePassword: (data) => api.patch('/auth/change-password', data),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token, password) => api.patch(`/auth/reset-password/${token}`, { password }),
    verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
    refreshToken: () => api.post('/auth/refresh-token'),
  };

  petsAPI = {
    getPets: (params) => api.get('/pets', { params }),
    getPet: (id) => api.get(`/pets/${id}`),
    createPet: (formData) =>
      api.post('/pets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    updatePet: (id, formData) =>
      api.put(`/pets/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    deletePet: (id) => api.delete(`/pets/${id}`),
    getFeaturedPets: (limit) => api.get('/pets/featured', { params: { limit } }),
    getPetStatistics: () => api.get('/pets/statistics'),
    getShelterPets: (shelterId, params) => api.get(`/pets/shelter/${shelterId}`, { params }),
    toggleFeatured: (id) => api.patch(`/pets/${id}/featured`),
    markAsAdopted: (id, adopterId) => api.patch(`/pets/${id}/adopt`, { adopterId }),
  };

  adoptionAPI = {
    createRequest: (petId, data) => api.post(`/adopt/${petId}`, data),
    getMyRequests: (params) => api.get('/adopt/my-requests', { params }),
    getShelterRequests: (shelterId, params) =>
      api.get(shelterId ? `/adopt/shelter/${shelterId}` : '/adopt/shelter/requests', { params }),
    getRequest: (id) => api.get(`/adopt/${id}`),
    approveRequest: (id, response) => api.patch(`/adopt/${id}/approve`, { response }),
    rejectRequest: (id, response) => api.patch(`/adopt/${id}/reject`, { response }),
    withdrawRequest: (id) => api.patch(`/adopt/${id}/withdraw`),
    addNote: (id, content) => api.post(`/adopt/${id}/notes`, { content }),
    getStatistics: () => api.get('/adopt/statistics/overview'),
    updateRequestStatus: (id, status) => api.patch(`/adopt/${id}/status`, { status }),
  };

  adminAPI = {
    getUsers: () => api.get('/auth/admin/users'),
    deleteUser: (userId) => api.delete(`/auth/admin/users/${userId}`),
    getAllRequests: () => api.get('/adopt/admin/all'),
  };

  // Utility functions for common operations
  uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to upload image');
    }
  };

  downloadFile = async (url, filename) => {
    try {
      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  // Health check
  healthCheck = () => api.get('/health');
}

export { authAPI, petsAPI, adoptionAPI, adminAPI, uploadImage, downloadFile, healthCheck, USE_MOCK as isMockApi };
export default api;
