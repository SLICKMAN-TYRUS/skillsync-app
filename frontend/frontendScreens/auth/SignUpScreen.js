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
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { fetchLocations } from '../services/api';
import { signUp } from '../../services/authHelpers';

const BRAND_COLORS = {
  primary: '#2B75F6',
  accent: '#FFD166',
  slate: '#0F172A',
  subtle: '#F5F7FB',
  dangerBorder: '#FCA5A5',
  dangerFill: '#FEE2E2',
  dangerText: '#7F1D1D',
  successBorder: '#BBF7D0',
  successFill: '#DCFCE7',
  successText: '#0F5132',
};

export default function SignUpScreen() {
  const navigation = useNavigation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Student');
  // Default Kigali locations (8 places)
  const DEFAULT_KIGALI_LOCATIONS = [
    'Kimironko',
    'Kacyiru',
    'Remera',
    'Nyamirambo',
    'Nyarugenge',
    'Kicukiro',
    'Gisozi',
    'Kimihurura',
    'Gikondo',
    'Kibagabaga',
  ];
  const [location, setLocation] = useState(DEFAULT_KIGALI_LOCATIONS[0]);
  const [locations, setLocations] = useState([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setError('');
    setInfo('');
    if (!fullName || !email || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password should be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await signUp(fullName, email, password);
      setInfo('Account created! We are signing you in.');
      navigation.replace('RoleBased', { role });
    } catch (err) {
      console.error('Sign up error', err);
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') setError('An account with this email already exists.');
      else setError(err?.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const normalizeLocations = (list) =>
      Array.isArray(list)
        ? list
            .map((item, index) => {
              if (typeof item === 'string') {
                return { id: `loc-${index}`, name: item };
              }
              const derivedName = item?.name || item?.label || item?.title || '';
              if (!derivedName) {
                return null;
              }
              return { id: item.id || item.slug || item.code || `loc-${index}`, name: derivedName };
            })
            .filter(Boolean)
        : [];

    let mounted = true;
    (async () => {
      try {
        const data = await fetchLocations();
        if (!mounted) {
          return;
        }
        const normalized = normalizeLocations(data);
        if (normalized.length) {
          setLocations(normalized);
          if (!location) {
            setLocation(normalized[0].name);
          }
        } else {
          const fallback = DEFAULT_KIGALI_LOCATIONS.map((n, i) => ({ id: `kig-${i}`, name: n }));
          setLocations(fallback);
          if (!location) {
            setLocation(fallback[0].name);
          }
        }
      } catch (e) {
        console.warn('Failed to load locations', e);
        if (!mounted) {
          return;
        }
        const fallback = DEFAULT_KIGALI_LOCATIONS.map((n, i) => ({ id: `kig-${i}`, name: n }));
        setLocations(fallback);
        if (!location) {
          setLocation(fallback[0].name);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const renderMessage = (type, text, onDismiss) => (
    <View style={[styles.messageCard, type === 'error' ? styles.messageError : styles.messageInfo]}>
      <Ionicons
        name={type === 'error' ? 'alert-circle-outline' : 'sparkles-outline'}
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
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.heroPanel}>
            <SkillSyncGraffiti caption="Connect • Earn • Grow" />
            <Text style={styles.heroTitle}>Create your account</Text>
            <Text style={styles.heroCopy}>
              Connect with providers, showcase your wins, and unlock new opportunities.
            </Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Sign up</Text>
            {error ? renderMessage('error', error, () => setError('')) : null}
            {info ? renderMessage('info', info, () => setInfo('')) : null}

            <View style={styles.inputGroup}>
              <Ionicons name="person-circle-outline" size={18} color={BRAND_COLORS.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.inputField}
                placeholder="Full name"
                value={fullName}
                onChangeText={setFullName}
                autoComplete="name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Ionicons name="mail-outline" size={18} color={BRAND_COLORS.primary} style={styles.inputIcon} />
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
              <Ionicons name="lock-closed-outline" size={18} color={BRAND_COLORS.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.inputField}
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                autoComplete="password"
              />
            </View>

            <View style={styles.inputGroup}>
              <Ionicons name="shield-checkmark-outline" size={18} color={BRAND_COLORS.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.inputField}
                placeholder="Confirm password"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoComplete="password"
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Sign up as</Text>
              {Platform.OS === 'web' ? (
                <View style={styles.roleChipRow}>
                  {['Student', 'Provider', 'Admin'].map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.roleChip, role === r && styles.roleChipActive]}
                      onPress={() => setRole(r)}
                    >
                      <Text style={[styles.roleChipText, role === r && styles.roleChipTextActive]}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={role}
                    onValueChange={(itemValue) => setRole(itemValue)}
                    style={styles.picker}
                    dropdownIconColor={BRAND_COLORS.primary}
                  >
                    <Picker.Item label="Student" value="Student" />
                    <Picker.Item label="Provider" value="Provider" />
                    <Picker.Item label="Admin" value="Admin" />
                  </Picker>
                </View>
              )}
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Location</Text>
              <TouchableOpacity
                style={styles.inputGroup}
                onPress={() => setShowLocationDropdown((s) => !s)}
                accessibilityRole="button"
              >
                <Ionicons name="location-outline" size={18} color={BRAND_COLORS.primary} style={styles.inputIcon} />
                <Text style={styles.locationValue}>{location || 'Select a location'}</Text>
                <Ionicons
                  name={showLocationDropdown ? 'chevron-up-outline' : 'chevron-down-outline'}
                  size={16}
                  color={BRAND_COLORS.primary}
                />
              </TouchableOpacity>
              {showLocationDropdown ? (
                <View style={styles.locationDropdown}>
                  {locations.map((loc, idx) => {
                    const label = loc?.name || '';
                    if (!label) {
                      return null;
                    }
                    const key = loc.id || `loc-${idx}`;
                    return (
                      <TouchableOpacity
                        key={key}
                        style={styles.locationRow}
                        onPress={() => {
                          setLocation(label);
                          setShowLocationDropdown(false);
                        }}
                      >
                        <Text style={styles.locationText}>{label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
              onPress={handleSignUp}
              disabled={loading}
              accessibilityLabel="Create account"
            >
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Create account</Text>}
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity onPress={() => navigation.navigate('Login')} accessibilityRole="button">
              <Text style={styles.switchAuthText}>Already have an account? Login</Text>
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
    paddingBottom: 48,
  },
  heroPanel: {
    marginTop: 24,
    marginBottom: 28,
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
    borderRadius: 28,
    padding: 24,
    shadowColor: BRAND_COLORS.slate,
    shadowOpacity: 0.12,
    shadowRadius: 30,
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
  fieldBlock: {
    marginTop: 12,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND_COLORS.primary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  roleChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  roleChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#E8F1FF',
    marginHorizontal: 6,
    marginBottom: 10,
  },
  roleChipActive: {
    backgroundColor: BRAND_COLORS.primary,
  },
  roleChipText: {
    color: '#1D4ED8',
    fontWeight: '600',
  },
  roleChipTextActive: {
    color: '#FFFFFF',
  },
  pickerWrapper: {
    borderWidth: Platform.OS === 'android' ? 1 : 0,
    borderRadius: 14,
    borderColor: '#D0D8EC',
    overflow: 'hidden',
  },
  picker: {
    backgroundColor: '#FFFFFF',
  },
  locationValue: {
    flex: 1,
    color: BRAND_COLORS.slate,
    fontSize: 15,
  },
  locationDropdown: {
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D0D8EC',
    maxHeight: 220,
    overflow: 'hidden',
  },
  locationRow: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9EFFC',
  },
  locationText: {
    color: BRAND_COLORS.primary,
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: BRAND_COLORS.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 22,
  },
  switchAuthText: {
    textAlign: 'center',
    color: '#334155',
    fontWeight: '600',
    fontSize: 14,
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
    color: 'rgba(15,23,42,0.22)',
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