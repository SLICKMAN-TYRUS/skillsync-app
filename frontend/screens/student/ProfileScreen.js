import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RoleBadge from '../../components/RoleBadge';
import { api } from '../../services/api';
import { fetchUserProfile } from '../../services/firestoreAdapter';
import { firebaseAuth } from '../../services/firebaseConfig';

const ProfileScreen = () => {
  const [profile, setProfile] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // State for editable fields
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    bio: '',
    location: '',
    phone: '',
    studentId: '',
    yearLevel: '',
    major: '',
    skills: [],
    experience: [],
    education: [],
    socialLinks: {
      github: '',
      linkedin: '',
      portfolio: ''
    }
  });
  
  const [newSkill, setNewSkill] = useState('');
  const [newExperience, setNewExperience] = useState({
    title: '',
    company: '',
    duration: '',
    description: ''
  });
  const [newEducation, setNewEducation] = useState({
    institution: '',
    degree: '',
    field: '',
    year: ''
  });

  const fetchProfile = async () => {
    try {
      setRefreshing(true);
      let data = null;
      
      try {
        const uid = firebaseAuth?.currentUser?.uid;
        if (uid) data = await fetchUserProfile(uid);
      } catch (e) {
        // ignore Firestore errors
      }

      if (data) {
        setProfile(data);
        setEditData(data);
      } else {
        // Try your backend API - using the endpoints we created
        const [basicResponse, extendedResponse] = await Promise.all([
          api.get('/users/profile'),
          api.get('/users/profile/extended')
        ]);
        
        const combinedData = {
          ...basicResponse.data,
          ...extendedResponse.data
        };
        
        setProfile(combinedData);
        setEditData(combinedData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      // Save basic profile
      await api.put('/users/profile', {
        name: editData.name,
        bio: editData.bio,
        location: editData.location
      });
      
      // Save extended profile data
      await api.put('/users/profile/extended', {
        phone: editData.phone,
        social_links: editData.socialLinks,
        experience: editData.experience,
        education: editData.education
      });
      
      // Update local state and exit edit mode
      setProfile(editData);
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
      
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async () => {
    if (newSkill.trim() && !editData.skills.includes(newSkill.trim())) {
      try {
        await api.post('/users/skills', { skill_name: newSkill.trim() });
        
        // Update local state
        setEditData(prev => ({
          ...prev,
          skills: [...prev.skills, newSkill.trim()]
        }));
        setNewSkill('');
        
      } catch (error) {
        console.error('Error adding skill:', error);
        Alert.alert('Error', 'Failed to add skill');
      }
    }
  };

  const handleRemoveSkill = async (skillToRemove) => {
    try {
      await api.delete(`/users/skills/${skillToRemove}`);
      
      // Update local state
      setEditData(prev => ({
        ...prev,
        skills: prev.skills.filter(skill => skill !== skillToRemove)
      }));
      
    } catch (error) {
      console.error('Error removing skill:', error);
      Alert.alert('Error', 'Failed to remove skill');
    }
  };

  const handleAddExperience = async () => {
    if (newExperience.title && newExperience.company) {
      try {
        const response = await api.post('/users/profile/experience', newExperience);
        const addedExperience = response.data;
        
        // Update local state
        setEditData(prev => ({
          ...prev,
          experience: [...prev.experience, addedExperience]
        }));
        
        setNewExperience({
          title: '', company: '', duration: '', description: ''
        });
        
      } catch (error) {
        console.error('Error adding experience:', error);
        Alert.alert('Error', 'Failed to add experience');
      }
    } else {
      Alert.alert('Error', 'Please fill in title and company');
    }
  };

  const handleRemoveExperience = async (expId) => {
    try {
      await api.delete(`/users/profile/experience/${expId}`);
      
      // Update local state
      setEditData(prev => ({
        ...prev,
        experience: prev.experience.filter(exp => exp.id !== expId)
      }));
      
    } catch (error) {
      console.error('Error removing experience:', error);
      Alert.alert('Error', 'Failed to remove experience');
    }
  };

  const handleAddEducation = async () => {
    if (newEducation.institution && newEducation.degree) {
      try {
        const response = await api.post('/users/profile/education', newEducation);
        const addedEducation = response.data;
        
        // Update local state
        setEditData(prev => ({
          ...prev,
          education: [...prev.education, addedEducation]
        }));
        
        setNewEducation({
          institution: '', degree: '', field: '', year: ''
        });
        
      } catch (error) {
        console.error('Error adding education:', error);
        Alert.alert('Error', 'Failed to add education');
      }
    } else {
      Alert.alert('Error', 'Please fill in institution and degree');
    }
  };

  const handleRemoveEducation = async (eduId) => {
    try {
      await api.delete(`/users/profile/education/${eduId}`);
      
      // Update local state
      setEditData(prev => ({
        ...prev,
        education: prev.education.filter(edu => edu.id !== eduId)
      }));
      
    } catch (error) {
      console.error('Error removing education:', error);
      Alert.alert('Error', 'Failed to remove education');
    }
  };

  const updateSocialLink = (platform, value) => {
    setEditData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }));
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await api.post('/auth/logout');
              // Handle logout in app context/navigation
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
          style: 'destructive',
        },
      ],
    );
  };

  const StatCard = ({ title, value, icon }) => (
    <View style={styles.statCard}>
      <Icon name={icon} size={24} color="#0066CC" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={fetchProfile} />
      }
    >
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          {profile.avatar ? (
            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {editData.name.charAt(0)}
              </Text>
            </View>
          )}
          <View style={styles.nameContainer}>
            {editing ? (
              <TextInput
                style={styles.editInput}
                value={editData.name}
                onChangeText={(text) => setEditData(prev => ({ ...prev, name: text }))}
                placeholder="Full Name"
              />
            ) : (
              <Text style={styles.name}>{editData.name}</Text>
            )}
            <RoleBadge role={profile.role} />
          </View>
          <Text style={styles.email}>{editData.email}</Text>
        </View>

        <View style={styles.buttonContainer}>
          {editing ? (
            <>
              <TouchableOpacity
                style={[styles.editButton, styles.cancelButton]}
                onPress={() => {
                  setEditData(profile);
                  setEditing(false);
                }}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editButton, styles.saveButton]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditing(true)}
            >
              <Icon name="edit" size={20} color="#FFFFFF" />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Personal Information Section - Editable */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Bio</Text>
          {editing ? (
            <TextInput
              style={styles.textInput}
              value={editData.bio}
              onChangeText={(text) => setEditData(prev => ({ ...prev, bio: text }))}
              placeholder="Tell us about yourself"
              multiline
            />
          ) : (
            <Text style={styles.infoValue}>{editData.bio || 'Not provided'}</Text>
          )}
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Location</Text>
          {editing ? (
            <TextInput
              style={styles.textInput}
              value={editData.location}
              onChangeText={(text) => setEditData(prev => ({ ...prev, location: text }))}
              placeholder="Your location"
            />
          ) : (
            <Text style={styles.infoValue}>{editData.location || 'Not provided'}</Text>
          )}
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone</Text>
          {editing ? (
            <TextInput
              style={styles.textInput}
              value={editData.phone}
              onChangeText={(text) => setEditData(prev => ({ ...prev, phone: text }))}
              placeholder="Your phone number"
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={styles.infoValue}>{editData.phone || 'Not provided'}</Text>
          )}
        </View>
      </View>

      {/* Academic Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Academic Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Student ID</Text>
          <Text style={styles.infoValue}>{editData.studentId}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Year Level</Text>
          <Text style={styles.infoValue}>{editData.yearLevel}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Major</Text>
          <Text style={styles.infoValue}>{editData.major}</Text>
        </View>
      </View>

      {/* Skills Section - Editable */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skills</Text>
        {editing && (
          <View style={styles.skillInputContainer}>
            <TextInput
              style={[styles.textInput, styles.flex1]}
              value={newSkill}
              onChangeText={setNewSkill}
              placeholder="Add a new skill"
              onSubmitEditing={handleAddSkill}
            />
            <TouchableOpacity style={styles.addSmallButton} onPress={handleAddSkill}>
              <Text style={styles.addSmallButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.skillsContainer}>
          {editData.skills.map((skill, index) => (
            <View key={index} style={styles.skillBadge}>
              <Text style={styles.skillText}>{skill}</Text>
              {editing && (
                <TouchableOpacity onPress={() => handleRemoveSkill(skill)}>
                  <Icon name="close" size={16} color="#0066CC" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Experience Section - New & Editable */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Work Experience</Text>
        {editing && (
          <>
            <TextInput
              style={styles.textInput}
              value={newExperience.title}
              onChangeText={(text) => setNewExperience(prev => ({ ...prev, title: text }))}
              placeholder="Job Title"
            />
            <TextInput
              style={styles.textInput}
              value={newExperience.company}
              onChangeText={(text) => setNewExperience(prev => ({ ...prev, company: text }))}
              placeholder="Company"
            />
            <TextInput
              style={styles.textInput}
              value={newExperience.duration}
              onChangeText={(text) => setNewExperience(prev => ({ ...prev, duration: text }))}
              placeholder="Duration (e.g., Jan 2020 - Dec 2022)"
            />
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={newExperience.description}
              onChangeText={(text) => setNewExperience(prev => ({ ...prev, description: text }))}
              placeholder="Description"
              multiline
            />
            <TouchableOpacity style={styles.addSmallButton} onPress={handleAddExperience}>
              <Text style={styles.addSmallButtonText}>Add Experience</Text>
            </TouchableOpacity>
          </>
        )}
        
        {editData.experience.map((exp) => (
          <View key={exp.id} style={styles.listItem}>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>{exp.title}</Text>
              <Text style={styles.listItemSubtitle}>{exp.company}</Text>
              <Text style={styles.listItemDuration}>{exp.duration}</Text>
              {exp.description && (
                <Text style={styles.listItemDescription}>{exp.description}</Text>
              )}
            </View>
            {editing && (
              <TouchableOpacity onPress={() => handleRemoveExperience(exp.id)}>
                <Icon name="delete" size={20} color="#F44336" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* Education Section - New & Editable */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Education</Text>
        {editing && (
          <>
            <TextInput
              style={styles.textInput}
              value={newEducation.institution}
              onChangeText={(text) => setNewEducation(prev => ({ ...prev, institution: text }))}
              placeholder="Institution"
            />
            <TextInput
              style={styles.textInput}
              value={newEducation.degree}
              onChangeText={(text) => setNewEducation(prev => ({ ...prev, degree: text }))}
              placeholder="Degree"
            />
            <TextInput
              style={styles.textInput}
              value={newEducation.field}
              onChangeText={(text) => setNewEducation(prev => ({ ...prev, field: text }))}
              placeholder="Field of Study"
            />
            <TextInput
              style={styles.textInput}
              value={newEducation.year}
              onChangeText={(text) => setNewEducation(prev => ({ ...prev, year: text }))}
              placeholder="Year"
            />
            <TouchableOpacity style={styles.addSmallButton} onPress={handleAddEducation}>
              <Text style={styles.addSmallButtonText}>Add Education</Text>
            </TouchableOpacity>
          </>
        )}
        
        {editData.education.map((edu) => (
          <View key={edu.id} style={styles.listItem}>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>{edu.institution}</Text>
              <Text style={styles.listItemSubtitle}>{edu.degree} in {edu.field}</Text>
              <Text style={styles.listItemDuration}>{edu.year}</Text>
            </View>
            {editing && (
              <TouchableOpacity onPress={() => handleRemoveEducation(edu.id)}>
                <Icon name="delete" size={20} color="#F44336" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* Social Links Section - Editable */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Social Links</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>GitHub</Text>
          {editing ? (
            <TextInput
              style={styles.textInput}
              value={editData.socialLinks.github}
              onChangeText={(text) => updateSocialLink('github', text)}
              placeholder="GitHub URL"
            />
          ) : (
            <Text style={styles.infoValue}>{editData.socialLinks.github || 'Not provided'}</Text>
          )}
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>LinkedIn</Text>
          {editing ? (
            <TextInput
              style={styles.textInput}
              value={editData.socialLinks.linkedin}
              onChangeText={(text) => updateSocialLink('linkedin', text)}
              placeholder="LinkedIn URL"
            />
          ) : (
            <Text style={styles.infoValue}>{editData.socialLinks.linkedin || 'Not provided'}</Text>
          )}
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Portfolio</Text>
          {editing ? (
            <TextInput
              style={styles.textInput}
              value={editData.socialLinks.portfolio}
              onChangeText={(text) => updateSocialLink('portfolio', text)}
              placeholder="Portfolio URL"
            />
          ) : (
            <Text style={styles.infoValue}>{editData.socialLinks.portfolio || 'Not provided'}</Text>
          )}
        </View>
      </View>

      {/* Account Settings (Keep original) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        <TouchableOpacity style={styles.settingButton}>
          <Icon name="notifications" size={24} color="#333333" />
          <Text style={styles.settingText}>Notifications</Text>
          <Icon name="chevron-right" size={24} color="#666666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingButton}>
          <Icon name="security" size={24} color="#333333" />
          <Text style={styles.settingText}>Privacy & Security</Text>
          <Icon name="chevron-right" size={24} color="#666666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingButton} onPress={handleLogout}>
          <Icon name="logout" size={24} color="#F44336" />
          <Text style={[styles.settingText, styles.logoutText]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// ADD THESE NEW STYLES TO YOUR EXISTING STYLES
const styles = StyleSheet.create({
  // ... KEEP ALL YOUR EXISTING STYLES ...
  
  // ADD THESE NEW STYLES:
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  editInput: {
    fontSize: 24,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#0066CC',
    padding: 4,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  skillInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  flex1: {
    flex: 1,
  },
  addSmallButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: 'center',
  },
  addSmallButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#666666',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  listItemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  listItemDuration: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  listItemDescription: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
  },
  skillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    gap: 4,
  },
});

export default ProfileScreen;