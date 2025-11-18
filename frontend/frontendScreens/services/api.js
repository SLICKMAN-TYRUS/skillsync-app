// frontendScreens/services/api.js

import axios from 'axios';

// Base URL for your backend API
// During development we prefer a local mock API so the frontend can work
// without the real backend. You can override with BACKEND_URL or MOCK_API_URL env vars.
const BASE_URL = process.env.BACKEND_URL || process.env.MOCK_API_URL || 'http://localhost:4000/api'; // Development mock API

// Axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    const response = await api.get('/gigs');
    return response.data;
  } catch (error) {
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
    const response = await api.post(`/gigs/${gigId}/apply`, { studentId });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Application failed' };
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

export default api;