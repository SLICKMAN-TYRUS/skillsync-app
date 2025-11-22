// frontendScreens/services/api.js

import axios from 'axios';
import { firebaseAuth } from '../../services/firebaseConfig';

// Base URL for your backend API
// During development we prefer a local backend. You can override with BACKEND_URL or MOCK_API_URL env vars.
const BASE_URL = process.env.REACT_APP_BACKEND_URL || process.env.BACKEND_URL || process.env.MOCK_API_URL || 'http://localhost:5000/api';

// Axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include Firebase auth token
api.interceptors.request.use(
  async (config) => {
    try {
      console.log('[API] Making request to:', config.url);
      
      // Check for test token in localStorage first (for development)
      if (typeof window !== 'undefined' && window.localStorage) {
        const useTestTokens = window.localStorage.getItem('use_test_tokens');
        const testUid = window.localStorage.getItem('dev_test_uid');
        const testRole = window.localStorage.getItem('dev_test_role');
        
        if (useTestTokens === 'true' && testUid && testRole) {
          config.headers.Authorization = `Bearer test:${testUid}:${testRole}`;
          console.log('[API] Using test token for:', testRole);
          return config;
        }
      }
      
      // Get Firebase auth token
      if (firebaseAuth && firebaseAuth.currentUser) {
        const token = await firebaseAuth.currentUser.getIdToken(true);
        config.headers.Authorization = `Bearer ${token}`;
        console.log('[API] Using Firebase token');
      } else {
        console.warn('[API] No authentication available - request may fail');
      }
    } catch (error) {
      console.error('[API] Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error logging
api.interceptors.response.use(
  (response) => {
    console.log('[API] Response from:', response.config.url, 'Status:', response.status);
    return response;
  },
  (error) => {
    console.error('[API] Request failed:', error.config?.url, error.response?.status, error.message);
    return Promise.reject(error);
  }
);

// 🔐 Authentication
export const loginUser = async (email, password, role) => {
  try {
    const response = await api.post('/auth/login', { email, password, role });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Login failed' };
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Signup failed' };
  }
};

// 📄 Gigs
export const fetchGigs = async () => {
  try {
    console.log('[fetchGigs] Fetching gigs from:', `${BASE_URL}/gigs`);
    const response = await api.get('/gigs');
    console.log('[fetchGigs] Response received:', response.status, response.data);
    // backend returns { items, page, per_page, total, pages } or an array in some flows
    if (response.data && response.data.items) {
      console.log('[fetchGigs] Returning', response.data.items.length, 'gigs');
      return response.data.items;
    }
    console.log('[fetchGigs] Returning raw data');
    return response.data;
  } catch (error) {
    console.error('[fetchGigs] Error:', error);
    throw error.response?.data || { message: 'Failed to fetch gigs' };
  }
};

// Development helpers
export const fetchRoutes = async () => {
  try {
    const response = await api.get('/routes');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch routes' };
  }
};

export const fetchLocations = async () => {
  try {
    const response = await api.get('/locations');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch locations' };
  }
};

export const applyToGig = async (gigId, studentId) => {
  try {
    // Backend application endpoint expects POST /applications with { gig_id, notes }
    const response = await api.post('/applications', { gig_id: gigId });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Application failed' };
  }
};

// Student helpers
export const studentApi = {
  getMyApplications: () => api.get('/applications/my-applications').then((r) => r.data),
  getProfile: () => api.get('/users/profile').then((r) => r.data),
};

export const fetchGigById = async (gigId) => {
  try {
    const response = await api.get(`/gigs/${gigId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch gig details' };
  }
};

export const saveGig = async (gigId) => {
  try {
    const response = await api.post('/users/saved-gigs', { gig_id: gigId });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to save gig' };
  }
};

export const fetchSavedGigs = async () => {
  try {
    const response = await api.get('/users/saved-gigs');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch saved gigs' };
  }
};

export const fetchCurrentProfile = async () => {
  try {
    const response = await api.get('/users/profile');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch profile' };
  }
};

// 💬 Messaging
export const sendMessage = async (threadId, senderId, text) => {
  try {
    const response = await api.post(`/messages/${threadId}`, {
      senderId,
      text,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Message failed to send' };
  }
};

export const fetchMessages = async (threadId) => {
  try {
    const response = await api.get(`/messages/${threadId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to load messages' };
  }
};

// 🧾 Profile
export const fetchUserProfile = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to load profile' };
  }
};

export const updateUserProfile = async (userId, updates) => {
  try {
    const response = await api.put(`/users/${userId}`, updates);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Profile update failed' };
  }
};

// Provider helpers (exported for provider screens)
export const providerApi = {
  getGigs: (params) => api.get('/gigs/my-gigs', { params }).then((r) => r.data),
  createGig: (data) => api.post('/gigs', data).then((r) => r.data),
  updateGig: (gigId, data) => api.put(`/gigs/${gigId}`, data).then((r) => r.data),
  deleteGig: (gigId) => api.delete(`/gigs/${gigId}`).then((r) => r.data),
  getApplicationsForGig: (gigId) => api.get(`/gigs/${gigId}/applications`).then((r) => r.data),
};

// Provider application actions
providerApi.selectApplication = (applicationId) => api.patch(`/applications/${applicationId}/select`).then((r) => r.data);
providerApi.rejectApplication = (applicationId) => api.patch(`/applications/${applicationId}/reject`).then((r) => r.data);

export default api;