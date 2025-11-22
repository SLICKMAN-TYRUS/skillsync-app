import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import ErrorBanner from '../../components/ErrorBanner';
import { signUp } from '../../services/authHelpers';
import HeaderBack from '../../components/HeaderBack';

const SignUpScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return 'Password must be at least 8 characters.';
    // require letters and numbers for a minimal strength
    if (!/[A-Za-z]/.test(pwd) || !/[0-9]/.test(pwd)) return 'Use letters and numbers in your password.';
    return '';
  };

  const handleSignUp = async () => {
    setError('');
    if (!name || !email || !password || !confirm) {
      setError('All fields are required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    const pwdErr = validatePassword(password);
    if (pwdErr) {
      setError(pwdErr);
      return;
    }

    setLoading(true);
    try {
      await signUp(name, email, password);
      navigation.navigate('StudentTabs');
    } catch (err) {
      console.error('Sign-up error:', err);
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') setError('An account with this email already exists.');
      else setError(err?.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBack title="Create account" />
      <Text style={styles.title}>Create an account</Text>
      <ErrorBanner message={error} onClose={() => setError('')} />
      <TextInput style={styles.input} placeholder="Full name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <TextInput style={styles.input} placeholder="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry />

      <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading} accessibilityLabel="Create account">
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create account</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('SignIn')} style={{ marginTop: 12 }}>
        <Text style={{ color: '#0066CC', textAlign: 'center' }}>Already have an account? Sign in</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 12 },
  button: { backgroundColor: '#0066CC', padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
});

export default SignUpScreen;
