// services/notifications.js
import messaging from '@react-native-firebase/messaging';
import api from './api';
import { Platform } from 'react-native';

export async function registerFCMToken() {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.log('Permission not granted for notifications');
      return null;
    }

    const token = await messaging().getToken();
    console.log('FCM token:', token);

    await api.post('/notifications/push-token', { token, platform: Platform.OS });
    return token;
  } catch (e) {
    console.warn('registerFCMToken error', e);
    return null;
  }
}

export async function fetchNotifications() {
  const res = await api.get('/notifications');
  return res.data;
}

export async function markNotificationRead(id) {
  await api.post('/notifications/mark-read', { id });
}

export async function getNotificationSettings() {
  const res = await api.get('/users/me/notification-settings');
  return res.data;
}

export async function setNotificationSettings(payload) {
  const res = await api.post('/users/me/notification-settings', payload);
  return res.data;
}

