import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api, { studentApi } from '../../services/api';
import { pickFile, MAX_FILE_SIZE } from '../../components/FilePicker';
import HeaderBack from '../../components/HeaderBack';
import ErrorBanner from '../../components/ErrorBanner';
import { fetchUserProfile } from '../../services/firestoreAdapter';
import { firebaseAuth } from '../../services/firebaseConfig';

const ProfileScreen = ({ navigation }) => {
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfile = async () => {
    try {
      setRefreshing(true);
      // Try Firestore user profile first (demo)
      let data = null;
      try {
        const uid = firebaseAuth?.currentUser?.uid;
        if (uid) data = await fetchUserProfile(uid);
      } catch (e) {
        // ignore
      }

      if (data) {
        setProfile(data);
      } else {
        const response = await api.get('/student/profile');
        setProfile(response.data);
      }

      // Fetch applications
      const appsResponse = await api.get('/applications');
      const formattedApps = appsResponse.data.map(app => ({
        id: app.id,
        title: app.gigTitle || app.title,
        status: app.status.charAt(0).toUpperCase() + app.status.slice(1),
        statusColor: getStatusColor(app.status),
      }));
      setApplications(formattedApps);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile data');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeModalVisible, setResumeModalVisible] = useState(false);
  const [resumeUrlInput, setResumeUrlInput] = useState('');
  const [schoolModalVisible, setSchoolModalVisible] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [studentIdNumber, setStudentIdNumber] = useState('');
  const [program, setProgram] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  // Settings modals
  const [activeSetting, setActiveSetting] = useState(null); // 'bio'|'education'|'experience'|'skills'|'contact'|'availability'|'languages'|'portfolio'
  const [bioInput, setBioInput] = useState('');
  const [educationInput, setEducationInput] = useState('');
  const [experienceInput, setExperienceInput] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [availabilityInput, setAvailabilityInput] = useState('');
  const [languagesInput, setLanguagesInput] = useState('');
  const [portfolioUrlInput, setPortfolioUrlInput] = useState('');

  const isValidResumeFilename = (name) => {
    if (!name) return false;
    const allowed = ['.pdf', '.doc', '.docx'];
    const lower = name.toLowerCase();
    return allowed.some((ext) => lower.endsWith(ext));
  };

  const pickAndUploadResume = async () => {
    try {
      // try to load expo-document-picker dynamically without letting webpack statically resolve it
      let DocumentPicker = null;
      try {
        // eslint-disable-next-line no-eval
        DocumentPicker = eval("require")('expo-document-picker');
      } catch (e) {
        DocumentPicker = null;
      }
      const res = DocumentPicker ? await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true }) : { type: 'cancel' };
      if (res.type !== 'success') return;
      const name = res.name || res.uri.split('/').pop();
      if (!isValidResumeFilename(name)) {
        Alert.alert('Invalid file', 'Please upload a PDF or Word document (.pdf, .doc, .docx)');
        return;
      }
      setResumeUploading(true);
      // request signed url via API; api baseURL includes /api so this maps to /api/uploads/signed-url
      const signedResp = await api.get(`/uploads/signed-url?filename=${encodeURIComponent(name)}`);
      const { uploadUrl, fileUrl } = signedResp.data;
      const fileData = await fetch(res.uri);
      const blob = await fileData.blob();
      await fetch(uploadUrl, { method: 'PUT', body: blob });
      // save profile with resume URL
      try {
        await studentApi.updateProfile({ resumeUrl: fileUrl });
      } catch (err) {
        // fallback to generic api
        await api.patch('/student/profile', { resumeUrl: fileUrl });
      }
      setProfile((p) => ({ ...(p || {}), resumeUrl: fileUrl }));
      Alert.alert('Success', 'Resume uploaded and saved');
    } catch (err) {
      console.error('Resume upload failed', err);
      setError(err?.message || String(err) || 'Upload failed');
    } finally {
      setResumeUploading(false);
    }
  };

  const submitResumeUrl = async () => {
    if (!resumeUrlInput || !isValidResumeFilename(resumeUrlInput)) {
      Alert.alert('Invalid URL', 'Please enter a link to a PDF or Word document (.pdf, .doc, .docx)');
      return;
    }
    setResumeUploading(true);
    try {
      // save profile via studentApi
      try {
        await studentApi.updateProfile({ resumeUrl: resumeUrlInput });
      } catch (err) {
        await api.patch('/student/profile', { resumeUrl: resumeUrlInput });
      }
      setProfile((p) => ({ ...(p || {}), resumeUrl: resumeUrlInput }));
      setResumeModalVisible(false);
      setResumeUrlInput('');
      Alert.alert('Saved', 'Resume link saved to your profile');
    } catch (err) {
      console.error('Saving resume URL failed', err);
      setError(err?.message || 'Failed to save resume');
    } finally {
      setResumeUploading(false);
    }
  };

  const submitSchoolDetails = async () => {
    if (!schoolName.trim() || !studentIdNumber.trim() || !program.trim()) {
      setError('Please fill in school name, student ID, and program');
      return;
    }
    try {
      const payload = { schoolName, studentIdNumber, program, yearOfStudy };
      try { await studentApi.updateProfile({ schoolDetails: payload }); }
      catch (err) { await api.patch('/student/profile', { schoolDetails: payload }); }
      setProfile((p) => ({ ...(p || {}), schoolDetails: payload }));
      setSchoolModalVisible(false);
      Alert.alert('Saved', 'School details saved and pending verification');
    } catch (err) {
      console.error('Saving school details failed', err);
      setError('Failed to save school details');
    }
  };

  const saveSetting = async () => {
    if (!activeSetting) return;
    setLoading(true);
    try {
      let payload = {};
      switch (activeSetting) {
        case 'bio':
          payload = { bio: bioInput };
          break;
        case 'education':
          // simple freeform education field
          payload = { education: educationInput };
          break;
        case 'experience':
          payload = { experience: experienceInput };
          break;
        case 'skills':
          payload = { skills: skillsInput.split(',').map(s => s.trim()).filter(Boolean) };
          break;
        case 'contact':
          payload = { phone: contactPhone };
          break;
        case 'availability':
          payload = { availability: availabilityInput };
          break;
        case 'languages':
          payload = { languages: languagesInput.split(',').map(s => s.trim()).filter(Boolean) };
          break;
        case 'portfolio':
          payload = { portfolioUrl: portfolioUrlInput };
          break;
        default:
          payload = {};
      }

      try {
        await studentApi.updateProfile(payload);
      } catch (err) {
        await api.patch('/student/profile', payload);
      }

      setProfile((p) => ({ ...(p || {}), ...payload }));
      setActiveSetting(null);
      Alert.alert('Saved', 'Profile updated');
    } catch (err) {
      console.error('Saving profile setting failed', err);
      setError('Failed to save profile setting');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'accepted':
      case 'approved':
        return '#4CAF50';
      case 'pending':
        return '#FFC107';
      case 'rejected':
      case 'declined':
        return '#F44336';
      default:
        return '#2196F3';
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2196F3" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchProfile} />
        }
      >
        <ErrorBanner message={error} onClose={() => setError('')} />
        {/* Profile Info Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {profile?.avatar ? (
              <Image source={{ uri: profile.avatar }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={40} color="#666666" />
            )}
          </View>
          
          <Text style={styles.userName}>{profile?.name || 'User Name'}</Text>
          <Text style={styles.applicationsText}>
            Done {applications.length} Applications
          </Text>
          <Text style={styles.userEmail}>{profile?.email || 'email@example.com'}</Text>
          <HeaderBack title="Profile" backTo="StudentDashboard" />

          {/* Resume upload */}
          <View style={{ marginTop: 12, alignItems: 'center' }}>
            {profile?.resumeUrl ? (
              <TouchableOpacity onPress={() => {
                // open resume in new window on web or navigate to a viewer in app
                if (typeof window !== 'undefined' && profile.resumeUrl) window.open(profile.resumeUrl, '_blank');
              }} style={styles.resumeRow}>
                <Ionicons name="document-text-outline" size={18} color="#0077cc" />
                <Text style={styles.resumeText}> View Resume</Text>
              </TouchableOpacity>
            ) : (
              <Text style={{ color: '#777', marginBottom: 8 }}>No resume uploaded</Text>
            )}

            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity style={styles.uploadButton} onPress={async () => {
                try {
                  const file = await pickFile();
                  if (!file) return;
                  if (file.size && file.size > MAX_FILE_SIZE) {
                    setError('File exceeds 5 MB limit');
                    return;
                  }
                  // use same upload flow as pickAndUploadResume but with file from pickFile
                  setResumeUploading(true);
                  const name = file.name;
                  const signedResp = await api.get(`/uploads/signed-url?filename=${encodeURIComponent(name)}`);
                  const { uploadUrl, fileUrl } = signedResp.data;
                  // on web we have file.file (File object)
                  if (file.file) {
                    await fetch(uploadUrl, { method: 'PUT', body: file.file });
                  } else {
                    const r = await fetch(file.uri);
                    const b = await r.blob();
                    await fetch(uploadUrl, { method: 'PUT', body: b });
                  }
                  try { await studentApi.updateProfile({ resumeUrl: fileUrl }); } catch (err) { await api.patch('/student/profile', { resumeUrl: fileUrl }); }
                  setProfile((p) => ({ ...(p || {}), resumeUrl: fileUrl }));
                  Alert.alert('Success', 'Resume uploaded and saved');
                } catch (err) {
                  console.error('Upload error', err);
                  setError('Failed to upload resume');
                } finally { setResumeUploading(false); }
              }} disabled={resumeUploading}>
                <Text style={styles.uploadButtonText}>{resumeUploading ? 'Uploading...' : 'Upload Resume'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.uploadButton, { backgroundColor: '#eee' }]} onPress={() => setResumeModalVisible(true)}>
                <Text style={[styles.uploadButtonText, { color: '#333' }]}>Add URL</Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* Settings tiles: allow students to add extra profile details */}
          <View style={{ width: '100%', paddingTop: 18, paddingHorizontal: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 12 }}>Profile Settings</Text>
            <View style={styles.settingsGrid}>
              {[
                { key: 'bio', icon: 'chatbubble-ellipses-outline', label: 'Bio' },
                { key: 'education', icon: 'school-outline', label: 'Education' },
                { key: 'experience', icon: 'briefcase-outline', label: 'Experience' },
                { key: 'skills', icon: 'sparkles-outline', label: 'Skills' },
                { key: 'contact', icon: 'call-outline', label: 'Contact' },
                { key: 'availability', icon: 'time-outline', label: 'Availability' },
                { key: 'languages', icon: 'language-outline', label: 'Languages' },
                { key: 'portfolio', icon: 'link-outline', label: 'Portfolio' },
              ].map((tile) => (
                <TouchableOpacity
                  key={tile.key}
                  style={styles.settingTile}
                  onPress={() => {
                    // prefill inputs from profile
                    const pd = profile || {};
                    setActiveSetting(tile.key);
                    setError('');
                    setBioInput(pd.bio || '');
                    setEducationInput((pd.education && pd.education.school) ? `${pd.education.school} — ${pd.education.program || ''}` : (pd.education || ''));
                    setExperienceInput(pd.experience || '');
                    setSkillsInput((pd.skills && Array.isArray(pd.skills)) ? pd.skills.join(', ') : (pd.skills || ''));
                    setContactPhone(pd.phone || '');
                    setAvailabilityInput(pd.availability || '');
                    setLanguagesInput((pd.languages && Array.isArray(pd.languages)) ? pd.languages.join(', ') : (pd.languages || ''));
                    setPortfolioUrlInput(pd.portfolioUrl || '');
                  }}
                >
                  <Ionicons name={tile.icon} size={26} color="#2b75f6" />
                  <Text style={styles.settingLabel}>{tile.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        
            {/* University ID Upload */}
            <View style={{ marginTop: 18, alignItems: 'center' }}>
              {profile?.universityIdUrl ? (
                <TouchableOpacity onPress={() => { if (typeof window !== 'undefined' && profile.universityIdUrl) window.open(profile.universityIdUrl, '_blank'); }} style={styles.resumeRow}>
                  <Ionicons name="card" size={18} color="#0077cc" />
                  <Text style={styles.resumeText}> View University ID</Text>
                </TouchableOpacity>
              ) : (
                <Text style={{ color: '#777', marginBottom: 8 }}>No university ID uploaded</Text>
              )}

              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity style={styles.uploadButton} onPress={async () => {
                  try {
                    const file = await pickFile();
                    if (!file) return;
                    if (file.size && file.size > MAX_FILE_SIZE) { setError('File exceeds 5 MB limit'); return; }
                    setResumeUploading(true);
                    const name = file.name;
                    const signedResp = await api.get(`/uploads/signed-url?filename=${encodeURIComponent(name)}`);
                    const { uploadUrl, fileUrl } = signedResp.data;
                    if (file.file) { await fetch(uploadUrl, { method: 'PUT', body: file.file }); } else { const r = await fetch(file.uri); const b = await r.blob(); await fetch(uploadUrl, { method: 'PUT', body: b }); }
                    try { await studentApi.updateProfile({ universityIdUrl: fileUrl }); } catch (err) { await api.patch('/student/profile', { universityIdUrl: fileUrl }); }
                    setProfile((p) => ({ ...(p || {}), universityIdUrl: fileUrl }));
                    Alert.alert('Success', 'University ID uploaded and saved');
                  } catch (err) {
                    console.error('Upload error', err);
                    setError('Failed to upload university ID');
                  } finally { setResumeUploading(false); }
                }}>
                  <Text style={styles.uploadButtonText}>Upload University ID</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.uploadButton, { backgroundColor: '#eee' }]} onPress={() => setSchoolModalVisible(true)}>
                  <Text style={[styles.uploadButtonText, { color: '#333' }]}>Enter School Details</Text>
                </TouchableOpacity>
              </View>
            </View>
        </View>

        {/* My Applications Section */}
        <View style={styles.applicationsSection}>
          <Text style={styles.sectionTitle}>My Applications</Text>
          
          {applications.length > 0 ? (
            applications.map((application) => (
              <TouchableOpacity 
                key={application.id} 
                style={styles.applicationCard}
                onPress={() => navigation.navigate('ApplicationDetails', { id: application.id })}
              >
                <Text style={styles.applicationTitle}>{application.title}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${application.statusColor}20` },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: application.statusColor },
                    ]}
                  >
                    {application.status}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color="#CCCCCC" />
              <Text style={styles.emptyStateText}>No applications yet</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Resume URL modal */}
      <Modal visible={resumeModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00000066' }}>
          <View style={{ width: '90%', maxWidth: 480, backgroundColor: '#fff', borderRadius: 10, padding: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Add Resume URL</Text>
            <Text style={{ marginBottom: 8, color: '#666' }}>Paste a link to your resume (PDF or Word).</Text>
            <TextInput
              placeholder="https://.../resume.pdf"
              value={resumeUrlInput}
              onChangeText={setResumeUrlInput}
              style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 6, padding: 8, marginBottom: 12 }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => { setResumeModalVisible(false); setResumeUrlInput(''); }} style={{ padding: 10 }}>
                <Text style={{ color: '#666' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitResumeUrl} style={{ padding: 10 }}>
                <Text style={{ color: '#0077cc', fontWeight: '700' }}>{resumeUploading ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* School details modal */}
      <Modal visible={schoolModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00000066' }}>
          <View style={{ width: '90%', maxWidth: 480, backgroundColor: '#fff', borderRadius: 10, padding: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>School Details</Text>
            <TextInput placeholder="University / School" value={schoolName} onChangeText={setSchoolName} style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 6, padding: 8, marginBottom: 8 }} />
            <TextInput placeholder="Student ID Number" value={studentIdNumber} onChangeText={setStudentIdNumber} style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 6, padding: 8, marginBottom: 8 }} />
            <TextInput placeholder="Program / Course" value={program} onChangeText={setProgram} style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 6, padding: 8, marginBottom: 8 }} />
            <TextInput placeholder="Year of Study" value={yearOfStudy} onChangeText={setYearOfStudy} style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 6, padding: 8, marginBottom: 12 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => setSchoolModalVisible(false)} style={{ padding: 10 }}>
                <Text style={{ color: '#666' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitSchoolDetails} style={{ padding: 10 }}>
                <Text style={{ color: '#0077cc', fontWeight: '700' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Generic settings modal for profile fields */}
      <Modal visible={!!activeSetting} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00000066' }}>
          <View style={{ width: '92%', maxWidth: 520, backgroundColor: '#fff', borderRadius: 10, padding: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>{(activeSetting || '').replace(/^[a-z]/, c => c.toUpperCase())}</Text>
            <Text style={{ marginBottom: 8, color: '#666' }}>Update your {activeSetting} information below.</Text>

            {activeSetting === 'bio' && (
              <TextInput multiline value={bioInput} onChangeText={setBioInput} style={styles.modalInput} placeholder="Short bio about yourself" />
            )}

            {activeSetting === 'education' && (
              <TextInput value={educationInput} onChangeText={setEducationInput} style={styles.modalInput} placeholder="University — Program (e.g., Makerere University — Computer Science)" />
            )}

            {activeSetting === 'experience' && (
              <TextInput multiline value={experienceInput} onChangeText={setExperienceInput} style={styles.modalInput} placeholder="Describe your previous work or gigs" />
            )}

            {activeSetting === 'skills' && (
              <TextInput value={skillsInput} onChangeText={setSkillsInput} style={styles.modalInput} placeholder="Comma-separated list: e.g., Python, Tutoring, Excel" />
            )}

            {activeSetting === 'contact' && (
              <TextInput value={contactPhone} onChangeText={setContactPhone} style={styles.modalInput} placeholder="Phone number" keyboardType="phone-pad" />
            )}

            {activeSetting === 'availability' && (
              <TextInput value={availabilityInput} onChangeText={setAvailabilityInput} style={styles.modalInput} placeholder="e.g., Weekdays 6pm-9pm, Weekends 9am-2pm" />
            )}

            {activeSetting === 'languages' && (
              <TextInput value={languagesInput} onChangeText={setLanguagesInput} style={styles.modalInput} placeholder="Comma-separated: English, Kinyarwanda" />
            )}

            {activeSetting === 'portfolio' && (
              <TextInput value={portfolioUrlInput} onChangeText={setPortfolioUrlInput} style={styles.modalInput} placeholder="https://portfolio.example.com" autoCapitalize="none" />
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
              <TouchableOpacity onPress={() => setActiveSetting(null)} style={{ padding: 10 }}>
                <Text style={{ color: '#666' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveSetting} style={{ padding: 10 }}>
                <Text style={{ color: '#0077cc', fontWeight: '700' }}>{loading ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom navigation intentionally removed for cleaner student profile */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  applicationsText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666666',
  },
  applicationsSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  applicationCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  applicationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  resumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resumeText: {
    color: '#0077cc',
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: '#0077cc',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999999',
    marginTop: 8,
  },
  settingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  settingTile: {
    width: '23%',
    minWidth: 72,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 1,
  },
  settingLabel: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    color: '#333',
    fontWeight: '600',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    padding: 10,
    minHeight: 44,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  navTextActive: {
    color: '#2196F3',
  },
});

export default ProfileScreen;