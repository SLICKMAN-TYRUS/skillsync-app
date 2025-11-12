// Firebase client configuration (inserted from provided project credentials)
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration (from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyBXmJC7rZJ1RqIzt9Zl8XZAi9-6fR9M2RI",
  authDomain: "skillsync-app-e7ae7.firebaseapp.com",
  projectId: "skillsync-app-e7ae7",
  storageBucket: "skillsync-app-e7ae7.firebasestorage.app",
  messagingSenderId: "825420618141",
  appId: "1:825420618141:web:f6365c4e0b6c82bca47774",
  measurementId: "G-VP6CSFP2G9",
};

// Initialize Firebase app and SDKs
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
