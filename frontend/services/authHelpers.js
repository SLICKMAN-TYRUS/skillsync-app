import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { firebaseAuth } from './firebaseConfig';

export async function signIn(email, password) {
  const normalizedEmail = email?.trim();
  const userCredential = await signInWithEmailAndPassword(firebaseAuth, normalizedEmail, password);
  const user = userCredential.user;
  const idToken = await user.getIdToken();
  await AsyncStorage.setItem('auth_token', idToken);
  await AsyncStorage.setItem('user', JSON.stringify({ uid: user.uid, email: user.email }));
  return user;
}

export async function signUp(name, email, password) {
  const normalizedEmail = email?.trim();
  const userCredential = await createUserWithEmailAndPassword(firebaseAuth, normalizedEmail, password);
  const user = userCredential.user;
  // set display name where possible
  try {
    await updateProfile(user, { displayName: name });
  } catch (e) {
    // non-fatal
  }
  const idToken = await user.getIdToken();
  await AsyncStorage.setItem('auth_token', idToken);
  await AsyncStorage.setItem('user', JSON.stringify({ uid: user.uid, email: user.email, name }));
  return { uid: user.uid, email: user.email };
}

export async function signOut() {
  try {
    await firebaseAuth.signOut();
  } catch (e) {
    // ignore
  }
  await AsyncStorage.multiRemove(['auth_token', 'refresh_token', 'user']);
}

export async function requestPasswordReset(email) {
  if (!email) {
    throw new Error('Email is required to reset the password.');
  }
  await sendPasswordResetEmail(firebaseAuth, email.trim());
}

export default { signIn, signUp, signOut, requestPasswordReset };
