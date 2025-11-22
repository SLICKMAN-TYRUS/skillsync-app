import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import ErrorBanner from '../../components/ErrorBanner';
import { signIn, signOut } from '../../services/authHelpers';
import api from '../../services/api';
import { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Clear credential fields when dev-test auth is enabled or changed.
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const enabled = window.localStorage.getItem('use_test_tokens');
        if (enabled === 'true') {
          setEmail('');
          setPassword('');
        }

        const storageHandler = (e) => {
          if (!e) return;
          if (e.key === 'dev_test_uid' || e.key === 'dev_test_role' || e.key === 'use_test_tokens') {
            setEmail('');
            setPassword('');
          }
        };
        window.addEventListener('storage', storageHandler);
        return () => window.removeEventListener('storage', storageHandler);
      }
    } catch (e) {
      // ignore in non-browser environments
    }
  }, []);

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await signIn(email, password);
      
      // Use Firebase user to get the ID token with custom claims
      const user = userCredential.user || userCredential;
      const idTokenResult = await user.getIdTokenResult(true);
      const role = idTokenResult.claims.role || 'student';
      const roleCapitalized = role.charAt(0).toUpperCase() + role.slice(1);
      
      navigation.replace('RoleBased', { role: roleCapitalized });
    } catch (err) {
      console.error('Login error', err);
      const code = err?.code || '';
      if (code === 'auth/user-not-found') setError('No account found for this email.');
      else if (code === 'auth/wrong-password') setError('Incorrect password.');
      else setError(err?.message || 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.logoSquare}>
          <Text style={styles.logoInitials}>SS</Text>
        </View>
        <View style={styles.headerTextCol}>
          <Text style={styles.brandText}>SkillSync</Text>
          <Text style={styles.taglineText}>Connect Earn Grow</Text>
        </View>
      </View>
      <Text style={styles.title}>Login</Text>

      <ErrorBanner message={error} onClose={() => setError('')} />
      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />



      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading} accessibilityLabel="Login">
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.link}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 24, textAlign: 'center', color: '#0077cc' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  logoSquare: { width: 88, height: 88, borderRadius: 12, backgroundColor: '#2b75f6', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  logoInitials: { color: '#fff', fontWeight: '900', fontSize: 28 },
  headerTextCol: { flexDirection: 'column' },
  brandText: { color: '#ffd166', fontWeight: '900', fontSize: 34, fontFamily: Platform.OS === 'web' ? 'Georgia' : undefined },
  taglineText: { fontSize: 14, fontWeight: '600', color: '#94a3b8', marginTop: 4, fontFamily: Platform.OS === 'web' ? 'Georgia' : undefined },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  dropdownContainer: { marginBottom: 16 },
  dropdownLabel: { fontSize: 14, fontWeight: '600', marginBottom: 6, color: '#333' },
  picker: {
    borderWidth: Platform.OS === 'android' ? 1 : 0,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#0077cc',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  link: { color: '#0077cc', textAlign: 'center', fontSize: 14 },
  roleRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  roleButtonSelected: { backgroundColor: '#0077cc' },
  roleText: { color: '#000', fontWeight: '600' },
});