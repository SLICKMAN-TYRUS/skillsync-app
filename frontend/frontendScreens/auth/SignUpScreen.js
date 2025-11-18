import React, { useState, useEffect } from 'react';
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
import { fetchLocations } from '../services/api';

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

  const handleSignUp = () => {
    // TODO: Add validation and backend registration logic
    navigation.replace('RoleBased', { role });
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchLocations();
        if (mounted) {
          if (Array.isArray(data) && data.length > 0) {
            setLocations(data);
            // if no explicit selection yet, pick the first fetched location
            if (!location) setLocation(data[0].name || data[0]);
          } else {
            // fallback to a curated list of Kigali places
            setLocations(DEFAULT_KIGALI_LOCATIONS.map((n, i) => ({ id: `kig-${i}`, name: n })));
            if (!location) setLocation(DEFAULT_KIGALI_LOCATIONS[0]);
          }
        }
      } catch (e) {
        console.warn('Failed to load locations', e);
        if (mounted) {
          setLocations(DEFAULT_KIGALI_LOCATIONS.map((n, i) => ({ id: `kig-${i}`, name: n })));
          if (!location) setLocation(DEFAULT_KIGALI_LOCATIONS[0]);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.logoSquare}>
          <Text style={styles.logoInitials}>SS</Text>
        </View>
        <View style={styles.headerTextCol}>
          <Text style={styles.brandText}>SkillSync</Text>
          <Text style={styles.taglineText}>Connect • Earn • Grow</Text>
        </View>
      </View>
      <Text style={styles.title}>Sign Up</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={fullName}
        onChangeText={setFullName}
      />
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
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <View style={styles.dropdownContainer}>
        <Text style={styles.dropdownLabel}>Sign Up As</Text>
        {Platform.OS === 'web' ? (
          <View style={styles.roleRow}>
            {['Student', 'Provider', 'Admin'].map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setRole(r)}
                style={[
                  styles.roleButton,
                  role === r ? styles.roleButtonSelected : null,
                ]}
              >
                <Text style={styles.roleText}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Picker
            selectedValue={role}
            onValueChange={(itemValue) => setRole(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Student" value="Student" />
            <Picker.Item label="Provider" value="Provider" />
            <Picker.Item label="Admin" value="Admin" />
          </Picker>
        )}
      </View>

      <View>
        <Text style={styles.dropdownLabel}>Location</Text>
        <View>
          <TouchableOpacity
            style={[styles.input, { justifyContent: 'center' }]}
            onPress={() => setShowLocationDropdown((s) => !s)}
          >
            <Text>{location || 'Select a location'}</Text>
          </TouchableOpacity>

          {showLocationDropdown && (
            <View style={styles.locationListInline}>
              {locations.map((loc) => (
                <TouchableOpacity
                  key={loc.id}
                  style={styles.locationItem}
                  onPress={() => {
                    setLocation(loc.name);
                    setShowLocationDropdown(false);
                  }}
                >
                  <Text>{loc.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Create Account</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // Align content to the top so expanding the inline dropdown pushes content below
  // without shifting content above.
  container: { flex: 1, justifyContent: 'flex-start', padding: 24, paddingTop: 32, backgroundColor: '#fff' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 24, textAlign: 'center', color: '#0077cc' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  logoSquare: { width: 96, height: 96, borderRadius: 12, backgroundColor: '#2b75f6', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  logoInitials: { color: '#fff', fontWeight: '900', fontSize: 30 },
  headerTextCol: { flexDirection: 'column' },
  brandText: { color: '#ffd166', fontWeight: '900', fontSize: 36, fontFamily: Platform.OS === 'web' ? 'Georgia' : undefined },
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
  locationList: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    maxHeight: 240,
    overflow: 'hidden',
    elevation: 3,
    paddingVertical: 4,
    marginTop: 6,
  },
  locationItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  positionRelative: {
    position: 'relative',
  },
  locationListInline: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    maxHeight: 240,
    overflow: 'hidden',
    elevation: 3,
    paddingVertical: 4,
    marginTop: 6,
  },
});