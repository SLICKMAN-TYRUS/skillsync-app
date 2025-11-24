// frontendScreens/providerDashboard/ProfileScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import HeaderBack from '../../components/HeaderBack';
import { pickFile, MAX_FILE_SIZE } from '../../components/FilePicker';
import api, { providerApi } from '../../services/api';
import { ensureTestAuth } from '../../services/devAuth';

const DEV_TEST_AUTH_ENABLED =
  (typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.ALLOW_DEV_TOKENS === 'true';
const PROFILE_PLACEHOLDER = 'https://placehold.co/90x90/0077cc/ffffff?text=P';

export default function ProfileScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);

  // Identity docs
  const [passportUrl, setPassportUrl] = useState('');
  const [nationalIdUrl, setNationalIdUrl] = useState('');
  const [driverLicenseUrl, setDriverLicenseUrl] = useState('');
  const [companyLicenseUrl, setCompanyLicenseUrl] = useState('');

  useEffect(() => {
    let active = true;
    const fetchProfile = async () => {
      try {
        if (DEV_TEST_AUTH_ENABLED) {
          await ensureTestAuth('firebase-uid-provider1', 'provider');
        }
        const response = providerApi?.getProfile
          ? await providerApi.getProfile()
          : await providerApi.getDashboard();
        const data = response?.data || response;
        if (!active || !data) {
          return;
        }
        setName(data.name || '');
        setEmail(data.email || '');
        setLocation(data.location || '');
        setBio(data.bio || '');
        setProfilePhoto(data.profile_photo || null);
      } catch (err) {
        console.error('Failed to load provider profile', err);
      }
    };
    fetchProfile();
    return () => {
      active = false;
    };
  }, []);

  const handleSave = useCallback(async () => {
    try {
      const payload = {
        name: name?.trim() ?? '',
        location: location?.trim() ?? '',
        bio: bio?.trim() ?? '',
      };
      if (providerApi && providerApi.updateProfile) {
        const response = await providerApi.updateProfile(payload);
        const data = response?.data || response;
        if (data?.profile_photo) {
          setProfilePhoto(data.profile_photo);
        }
      } else {
        await api.put('/users/profile', payload);
      }
      Alert.alert('Success', 'Profile updated!');
    } catch (err) {
      console.error('Save profile failed', err);
      Alert.alert('Error', 'Failed to save profile');
    }
  }, [name, location, bio]);

  const uploadAndSave = async (docKey, setter) => {
    try {
      const file = await pickFile();
      if (!file) return;
      if (file.size && file.size > MAX_FILE_SIZE) {
        Alert.alert('File too large', 'Please select a file smaller than 5 MB.');
        return;
      }

      const filename = `${Date.now()}_${file.name}`.replace(/[^a-zA-Z0-9._-]/g, '_');
      const signed = await api.get('/uploads/signed-url', { params: { filename } });
      const { uploadUrl, fileUrl } = signed.data || signed;

      // Prepare body
      let body;
      if (file.file) {
        // Web: file.file is a File
        body = file.file;
      } else {
        // Native: fetch the uri into blob
        const r = await fetch(file.uri);
        body = await r.blob();
      }

      // PUT to uploadUrl
      await fetch(uploadUrl, { method: 'PUT', body });

      // Update local state and persist to backend
      setter(fileUrl);
      // Save to profile immediately
      const updatePayload = { [docKey]: fileUrl };
      if (providerApi && providerApi.updateProfile) {
        await providerApi.updateProfile(updatePayload);
      } else {
        await api.put('/users/profile', updatePayload);
      }
      Alert.alert('Uploaded', 'Document uploaded successfully and saved to your profile.');
    } catch (err) {
      console.error('Upload failed', err);
      Alert.alert('Upload failed', 'Could not upload the selected file.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <HeaderBack title="Profile" backTo="ProviderDashboard" />
        <Text style={styles.header}>Provider Profile</Text>

        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: profilePhoto || PROFILE_PLACEHOLDER }}
            style={styles.avatar}
          />
          <Text style={styles.avatarLabel}>{name || 'Provider'}</Text>
        </View>

        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Full Name"
        />
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Phone Number"
          keyboardType="phone-pad"
        />
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="Location"
        />
        <TextInput
          style={[styles.input, styles.bioInput]}
          value={bio}
          onChangeText={setBio}
          placeholder="Short Bio"
          multiline
        />

        <View style={{ marginVertical: 8 }}>
          <Text style={{ fontWeight: '600', marginBottom: 6 }}>Identity Documents</Text>

          <TouchableOpacity style={styles.uploadRow} onPress={() => uploadAndSave('passportUrl', setPassportUrl)}>
            <Text style={styles.uploadLabel}>Upload Passport / ID</Text>
            <Text style={styles.uploadAction}>{passportUrl ? 'Replace' : 'Upload'}</Text>
          </TouchableOpacity>
          {passportUrl ? <Text style={styles.uploadPreview}>Uploaded: {passportUrl}</Text> : null}

          <TouchableOpacity style={styles.uploadRow} onPress={() => uploadAndSave('nationalIdUrl', setNationalIdUrl)}>
            <Text style={styles.uploadLabel}>Upload National ID</Text>
            <Text style={styles.uploadAction}>{nationalIdUrl ? 'Replace' : 'Upload'}</Text>
          </TouchableOpacity>
          {nationalIdUrl ? <Text style={styles.uploadPreview}>Uploaded: {nationalIdUrl}</Text> : null}

          <TouchableOpacity style={styles.uploadRow} onPress={() => uploadAndSave('driverLicenseUrl', setDriverLicenseUrl)}>
            <Text style={styles.uploadLabel}>Upload Driver's License</Text>
            <Text style={styles.uploadAction}>{driverLicenseUrl ? 'Replace' : 'Upload'}</Text>
          </TouchableOpacity>
          {driverLicenseUrl ? <Text style={styles.uploadPreview}>Uploaded: {driverLicenseUrl}</Text> : null}

          <TouchableOpacity style={styles.uploadRow} onPress={() => uploadAndSave('companyLicenseUrl', setCompanyLicenseUrl)}>
            <Text style={styles.uploadLabel}>Upload Company License (if applicable)</Text>
            <Text style={styles.uploadAction}>{companyLicenseUrl ? 'Replace' : 'Upload'}</Text>
          </TouchableOpacity>
          {companyLicenseUrl ? <Text style={styles.uploadPreview}>Uploaded: {companyLicenseUrl}</Text> : null}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>Save Changes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
  },
  container: {
    width: '90%',
    maxWidth: 500,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0077cc',
    marginBottom: 20,
    textAlign: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 8,
  },
  avatarLabel: {
    fontSize: 14,
    color: '#555',
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#0077cc',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  logoutButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  logoutText: {
    color: '#dc3545',
    fontWeight: '600',
  },
});