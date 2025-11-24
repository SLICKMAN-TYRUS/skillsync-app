import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { signIn, requestPasswordReset } from '../../services/authHelpers';

const BRAND_COLORS = {
  primary: '#2B75F6',
  accent: '#FFD166',
  slate: '#0F172A',
  subtle: '#F5F7FB',
  dangerBorder: '#FCA5A5',
  dangerFill: '#FEE2E2',
  dangerText: '#7F1D1D',
  successBorder: '#A7F3D0',
  successFill: '#DCFCE7',
  successText: '#065F46',
};

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);

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
      setInfo('');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      setInfo('');
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
      setInfo('');
    } catch (err) {
      console.error('Login error', err);
      const code = err?.code || '';
      if (code === 'auth/user-not-found') setError('No account found for this email.');
      else if (code === 'auth/wrong-password') setError('Incorrect password.');
      else setError(err?.message || 'Failed to sign in.');
      setInfo('');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setError('');
    setInfo('');
    if (!email) {
      setError('Enter your email above before requesting a reset link.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setResetLoading(true);
    try {
      await requestPasswordReset(email);
      setInfo('Password reset email sent. Check your inbox.');
    } catch (err) {
      console.error('Password reset error', err);
      const code = err?.code || '';
      if (code === 'auth/user-not-found') setError('No account found for this email.');
      else setError(err?.message || 'Unable to send reset email.');
    } finally {
      setResetLoading(false);
    }
  };

  const renderMessage = (type, text, onDismiss) => (
    <View style={[styles.messageCard, type === 'error' ? styles.messageError : styles.messageInfo]}>
      <Ionicons
        name={type === 'error' ? 'alert-circle-outline' : 'checkmark-circle-outline'}
        size={18}
        color={type === 'error' ? BRAND_COLORS.dangerText : BRAND_COLORS.successText}
        style={styles.messageIcon}
      />
      <Text style={[styles.messageText, type === 'error' ? styles.messageTextError : styles.messageTextInfo]}>
        {text}
      </Text>
      <TouchableOpacity onPress={onDismiss} style={styles.messageClose} accessibilityRole="button">
        <Ionicons name="close" size={16} color={type === 'error' ? BRAND_COLORS.dangerText : BRAND_COLORS.successText} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={BRAND_COLORS.subtle} />
      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroPanel}>
            <SkillSyncGraffiti caption="Connect • Earn • Grow" />
            <Text style={styles.heroTitle}>Welcome back!</Text>
            <Text style={styles.heroCopy}>Keep tabs on applications and unlock fresh Kigali gigs.</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Login</Text>
            {error ? renderMessage('error', error, () => setError('')) : null}
            {info ? renderMessage('info', info, () => setInfo('')) : null}

            <View style={styles.inputGroup}>
              <Ionicons name="mail-outline" size={18} color="#2563EB" style={styles.inputIcon} />
              <TextInput
                style={styles.inputField}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Ionicons name="lock-closed-outline" size={18} color="#2563EB" style={styles.inputIcon} />
              <TextInput
                style={styles.inputField}
                placeholder="Password"
                secureTextEntry={!passwordVisible}
                value={password}
                onChangeText={setPassword}
                autoComplete="password"
              />
              <TouchableOpacity
                onPress={() => setPasswordVisible((prev) => !prev)}
                style={styles.inputAction}
                accessibilityRole="button"
                accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
              >
                <Ionicons
                  name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#475569"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              accessibilityLabel="Login"
            >
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Login</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePasswordReset}
              disabled={resetLoading}
              accessibilityLabel="Forgot password"
            >
              <Text style={[styles.secondaryLink, resetLoading && styles.linkDisabled]}>
                {resetLoading ? 'Sending reset email…' : 'Forgot your password? Send reset link'}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity onPress={() => navigation.navigate('SignUp')} accessibilityRole="button">
              <Text style={styles.switchAuthText}>New to SkillSync? Create an account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BRAND_COLORS.subtle,
  },
  flexOne: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
  heroPanel: {
    marginTop: 32,
    marginBottom: 32,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: BRAND_COLORS.slate,
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? 'Poppins, sans-serif' : undefined,
  },
  heroCopy: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: BRAND_COLORS.slate,
    shadowOpacity: 0.12,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
    elevation: 5,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: BRAND_COLORS.slate,
    marginBottom: 18,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D0D8EC',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    paddingVertical: Platform.OS === 'web' ? 14 : 12,
    fontSize: 15,
    color: BRAND_COLORS.slate,
  },
  inputAction: {
    padding: 6,
  },
  primaryButton: {
    backgroundColor: BRAND_COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryLink: {
    color: BRAND_COLORS.primary,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 18,
  },
  switchAuthText: {
    textAlign: 'center',
    color: '#1E293B',
    fontWeight: '600',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 22,
  },
  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
    borderWidth: 1,
  },
  messageError: {
    backgroundColor: BRAND_COLORS.dangerFill,
    borderColor: BRAND_COLORS.dangerBorder,
  },
  messageInfo: {
    backgroundColor: BRAND_COLORS.successFill,
    borderColor: BRAND_COLORS.successBorder,
  },
  messageIcon: {
    marginRight: 8,
  },
  messageText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  messageTextError: {
    color: BRAND_COLORS.dangerText,
    fontWeight: '600',
  },
  messageTextInfo: {
    color: BRAND_COLORS.successText,
    fontWeight: '600',
  },
  messageClose: {
    padding: 6,
  },
  linkDisabled: {
    opacity: 0.6,
  },
  graffitiWrap: {
    alignSelf: 'flex-start',
    marginBottom: 20,
    position: 'relative',
  },
  graffitiShadow: {
    position: 'absolute',
    top: 6,
    left: 6,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: 'rgba(15,23,42,0.25)',
    transform: [{ rotate: '-1.5deg' }],
  },
  graffitiText: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: BRAND_COLORS.accent,
    transform: [{ rotate: '-1.5deg' }],
    textShadowColor: 'rgba(43,117,246,0.55)',
    textShadowOffset: { width: -2, height: 3 },
    textShadowRadius: 8,
    fontFamily: Platform.OS === 'web' ? '"Permanent Marker", cursive' : undefined,
  },
  graffitiCaption: {
    marginTop: 8,
    color: '#475569',
    fontWeight: '600',
    letterSpacing: 1,
    fontSize: 12,
    textTransform: 'uppercase',
  },
});

function SkillSyncGraffiti({ caption }) {
  return (
    <View style={styles.graffitiWrap}>
      <Text style={styles.graffitiShadow}>SkillSync</Text>
      <Text style={styles.graffitiText}>SkillSync</Text>
      <Text style={styles.graffitiCaption}>{caption}</Text>
    </View>
  );
}