// services/api.js
import axios from 'axios';
import auth from '@react-native-firebase/auth';

const api = axios.create({
  baseURL: 'https://your-backend.com/api', // <-- CHANGE this to your backend URL
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  try {
    const user = auth().currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.warn('Api interceptor error', err);
  }
  return config;
}, (error) => Promise.reject(error));

export default api;

