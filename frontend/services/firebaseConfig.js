// Firebase client configuration - prefer environment variables for sensitive values.
// This file supports two modes:
// 1) ENV mode: provide config via environment variables (recommended for deployment)
// 2) Fallback: keep an inline config (useful for quick local setups)

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Read from environment variables (prefer `REACT_APP_` for CRA/Expo web builds,
// then plain env var, then `FIREBASE_` prefix). The previous ordering made calls
// like env('FIREBASE_API_KEY') miss `REACT_APP_FIREBASE_API_KEY`.
const env = (key) => process.env[`REACT_APP_${key}`] || process.env[key] || process.env[`FIREBASE_${key}`];

const firebaseConfig = {
  apiKey: env('FIREBASE_API_KEY') || env('API_KEY') || 'REPLACE_ME',
  authDomain: env('FIREBASE_AUTH_DOMAIN') || `${env('FIREBASE_PROJECT_ID') || 'REPLACE_ME'}.firebaseapp.com`,
  projectId: env('FIREBASE_PROJECT_ID') || 'REPLACE_ME',
  storageBucket: env('FIREBASE_STORAGE_BUCKET') || `${env('FIREBASE_PROJECT_ID') || 'REPLACE_ME'}.appspot.com`,
  messagingSenderId: env('FIREBASE_MESSAGING_SENDER_ID') || env('MESSAGING_SENDER_ID') || '',
  appId: env('FIREBASE_APP_ID') || env('APP_ID') || '',
  measurementId: env('FIREBASE_MEASUREMENT_ID') || env('MEASUREMENT_ID') || '',
};

// Temporary inline fallback for local debugging: use the exact Web App config
// from your Firebase Console. This helps determine whether `.env` loading is
// the issue. Remove this block once you've verified the app can sign in.
const INLINE_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBXmJC7rZJ1RqIzt9Zl8XZAi9-6fR9M2RI',
  authDomain: 'skillsync-app-e7ae7.firebaseapp.com',
  projectId: 'skillsync-app-e7ae7',
  storageBucket: 'skillsync-app-e7ae7.firebasestorage.app',
  messagingSenderId: '825420618141',
  appId: '1:825420618141:web:f6365c4e0b6c82bca47774',
  measurementId: 'G-VP6CSFP2G9',
};

// If the computed config is missing the apiKey (meaning env wasn't picked up),
// fall back to the inline config for debugging.
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'REPLACE_ME') {
  // eslint-disable-next-line no-console
  console.warn('Firebase config API key missing from env; using inline debug config.');
  Object.assign(firebaseConfig, INLINE_FIREBASE_CONFIG);
}

// Initialize Firebase app and SDKs
// DEBUG: Print resolved config in development only (masks the API key). Remove this after troubleshooting.
if ((typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') || typeof window !== 'undefined') {
  try {
    const masked = Object.assign({}, firebaseConfig, { apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.slice(0, 6)}...` : firebaseConfig.apiKey });
    // eslint-disable-next-line no-console
    console.info('Firebase config (masked):', masked);
  } catch (e) {
    // ignore
  }
}

const app = initializeApp(firebaseConfig);

let analytics;
try {
  analytics = getAnalytics(app);
} catch (e) {
  // analytics may fail in non-browser or server environments — safe to ignore for now
}

export const firebaseAuth = getAuth(app);
export const firestore = getFirestore(app);
export default app;
