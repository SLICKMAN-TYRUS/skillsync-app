import axios from 'axios';
let AsyncStorage;
try {
  // Try native async storage (mobile)
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  // Fallback for web preview using localStorage
  /* eslint-disable no-undef */
  AsyncStorage = {
    getItem: async (k) => (typeof window !== 'undefined' ? window.localStorage.getItem(k) : null),
    setItem: async (k, v) => (typeof window !== 'undefined' ? window.localStorage.setItem(k, v) : null),
    removeItem: async (k) => (typeof window !== 'undefined' ? window.localStorage.removeItem(k) : null),
    multiRemove: async (keys) => (typeof window !== 'undefined' ? keys.forEach((k) => window.localStorage.removeItem(k)) : null),
  };
}

import { firebaseAuth } from './firebaseConfig';

// Create axios instance with default config
// Prefer an explicit BACKEND_URL environment variable (set when running Expo or in CI)
const DEFAULT_BACKEND = process.env.BACKEND_URL || process.env.MOCK_API_URL || 'http://localhost:4000/api';
const api = axios.create({
  baseURL: DEFAULT_BACKEND,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
api.interceptors.request.use(
  async (config) => {
    let token = await AsyncStorage.getItem('auth_token');
    // If no token in storage, try to get a fresh ID token from Firebase Auth
    try {
      if (!token && firebaseAuth && firebaseAuth.currentUser) {
        token = await firebaseAuth.currentUser.getIdToken(true);
        // also cache it for other code paths
        await AsyncStorage.setItem('auth_token', token);
      }
    } catch (err) {
      // ignore failures getting token (user unauthenticated)
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 (Unauthorized) responses
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        const response = await api.post('/auth/refresh', {
          refreshToken,
        });

        const { token } = response.data;
        await AsyncStorage.setItem('auth_token', token);

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (error) {
        // If refresh fails, redirect to login
        await handleLogout();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// Auth-related functions
const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  const { token, refreshToken, user } = response.data;
  
  await AsyncStorage.setItem('auth_token', token);
  await AsyncStorage.setItem('refresh_token', refreshToken);
  await AsyncStorage.setItem('user', JSON.stringify(user));
  
  return user;
};

const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

const handleLogout = async () => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    await AsyncStorage.multiRemove(['auth_token', 'refresh_token', 'user']);
  }
};

// Student API calls
const studentApi = {
  getGigs: (params) => api.get('/student/gigs', { params }),
  getGigDetails: (gigId) => api.get(`/student/gigs/${gigId}`),
  applyToGig: (gigId, data) => api.post(`/student/gigs/${gigId}/apply`, data),
  getApplications: (params) => api.get('/student/applications', { params }),
  getProfile: () => api.get('/student/profile'),
  updateProfile: (data) => api.patch('/student/profile', data),
};

// Provider API calls
const providerApi = {
  getDashboard: () => api.get('/provider/dashboard'),
  getGigs: (params) => api.get('/provider/gigs', { params }),
  createGig: (data) => api.post('/provider/gigs', data),
  updateGig: (gigId, data) => api.patch(`/provider/gigs/${gigId}`, data),
  deleteGig: (gigId) => api.delete(`/provider/gigs/${gigId}`),
  getApplications: (params) => api.get('/provider/applications', { params }),
  updateApplication: (applicationId, data) =>
    api.patch(`/provider/applications/${applicationId}`, data),
  getRatings: () => api.get('/provider/ratings'),
};

// Admin API calls
const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getPendingGigs: () => api.get('/admin/pending-gigs'),
  approveGig: (gigId) => api.post(`/admin/gigs/${gigId}/approve`),
  rejectGig: (gigId) => api.post(`/admin/gigs/${gigId}/reject`),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (userId, data) =>
    api.patch(`/admin/users/${userId}/status`, data),
  updateUserRole: (userId, data) =>
    api.patch(`/admin/users/${userId}/role`, data),
  getSystemLogs: (params) => api.get('/admin/system-logs', { params }),
};

// Development helpers (routes & locations) used by frontend screens when backend is not available
const fetchRoutes = async () => {
  try {
    const response = await api.get('/routes');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch routes' };
  }
};

const fetchLocations = async () => {
  try {
    const response = await api.get('/locations');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch locations' };
  }
};

export {
  api as default,
  login,
  register,
  handleLogout,
  studentApi,
  providerApi,
  adminApi,
  fetchRoutes,
  fetchLocations,
};
