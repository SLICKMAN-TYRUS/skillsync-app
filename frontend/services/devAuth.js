/*
  Dev auth helper (development only)
  - Stores a dev test UID and role in localStorage (web) or AsyncStorage (native)
  - Exposes `getDevAuthHeader()` which returns a string like
    `Bearer test:<uid>:<role>` when test auth is enabled and configured.

  Usage (web):
  - open browser console and run:
    localStorage.setItem('use_test_tokens', 'true');
    localStorage.setItem('dev_test_uid', 'firebase-uid-admin1');
    localStorage.setItem('dev_test_role', 'admin');
  - Refresh the app. Requests will include the dev test Authorization header.

  This file is intentionally minimal and only for development. Do NOT include
  test-token logic in production builds or committed production config.
*/

let AsyncStorage;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  AsyncStorage = null; // Web fallback uses window.localStorage directly
}

const _getLocal = async (key) => {
  if (AsyncStorage) return AsyncStorage.getItem(key);
  if (typeof window !== 'undefined') return window.localStorage.getItem(key);
  return null;
};

const _setLocal = async (key, value) => {
  if (AsyncStorage) return AsyncStorage.setItem(key, value);
  if (typeof window !== 'undefined') return window.localStorage.setItem(key, value);
  return null;
};

export const enableTestAuth = async (uid = 'firebase-uid-admin1', role = 'admin') => {
  await _setLocal('use_test_tokens', 'true');
  await _setLocal('dev_test_uid', uid);
  await _setLocal('dev_test_role', role);
};

export const disableTestAuth = async () => {
  await _setLocal('use_test_tokens', 'false');
  await _setLocal('dev_test_uid', '');
  await _setLocal('dev_test_role', '');
};

export const getDevAuthHeader = () => {
  try {
    // Synchronous access for convenience in axios interceptor
    if (typeof window !== 'undefined') {
      const enabled = window.localStorage.getItem('use_test_tokens');
      if (enabled !== 'true') return null;
      const uid = window.localStorage.getItem('dev_test_uid') || '';
      const role = window.localStorage.getItem('dev_test_role') || '';
      if (!uid || !role) return null;
      return `Bearer test:${uid}:${role}`;
    }

    // For native/AsyncStorage, try a sync-friendly approach via require (best-effort)
    if (AsyncStorage) {
      // AsyncStorage is async; return null here to avoid blocking. The api interceptor will
      // fallback to AsyncStorage token flow in that case.
      return null;
    }
  } catch (e) {
    // ignore
  }
  return null;
};

export default {
  enableTestAuth,
  disableTestAuth,
  getDevAuthHeader,
};
