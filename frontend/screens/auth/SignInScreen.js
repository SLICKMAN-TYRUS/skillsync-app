import React, { useState } from 'react';
import { useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import ErrorBanner from '../../components/ErrorBanner';
import { signIn } from '../../services/authHelpers';
import HeaderBack from '../../components/HeaderBack';

const SignInScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    setError('');
    // Basic validation
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    // simple email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      // Navigate to home - the app will fetch user profile and redirect if needed
      navigation.navigate('StudentTabs');
    } catch (err) {
      console.error('Sign-in error:', err);
      // Map common Firebase errors to friendly messages
      const code = err?.code || '';
      if (code === 'auth/user-not-found') setError('No account found for this email.');
      else if (code === 'auth/wrong-password') setError('Incorrect password.');
      else if (code === 'auth/invalid-email') setError('Invalid email address.');
      else if (code === 'auth/too-many-requests') setError('Too many attempts. Try again later.');
      else setError(err?.message || 'Sign-in failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

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
            // Clear fields whenever the dev test user or role is changed
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

  return (
    <View style={styles.container}>
      <HeaderBack title="Sign in" />
      <Text style={styles.title}>Sign in</Text>
      <ErrorBanner message={error} onClose={() => setError('')} />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleSignIn} disabled={loading} accessibilityLabel="Sign in">
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign in</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('SignUp')} style={{ marginTop: 12 }}>
        <Text style={{ color: '#0066CC', textAlign: 'center' }}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 12 },
  button: { backgroundColor: '#0066CC', padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
});

export default SignInScreen;
