import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RoleBadge from '../../components/RoleBadge';
import HeaderBack from '../../components/HeaderBack';
import { api } from '../../services/api';
import { fetchUserProfile } from '../../services/firestoreAdapter';
import { firebaseAuth } from '../../services/firebaseConfig';

const ProfileScreen = () => {
  const [profile, setProfile] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = async () => {
    try {
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
        const response = await api.get('/users/profile');
        setProfile(response.data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

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
      <HeaderBack title="Profile" backTo="Home" />
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          {profile.avatar ? (
            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {profile.name.charAt(0)}
              </Text>
            </View>
          )}
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{profile.name}</Text>
            <RoleBadge role={profile.role} />
          </View>
          <Text style={styles.email}>{profile.email}</Text>
        </View>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {/* Navigate to edit profile */}}
        >
          <Icon name="edit" size={20} color="#FFFFFF" />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <StatCard
          title="Applications"
          value={profile.stats.applications}
          icon="description"
        />
        <StatCard
          title="Accepted"
          value={profile.stats.accepted}
          icon="check-circle"
        />
        <StatCard
          title="Completed"
          value={profile.stats.completed}
          icon="star"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Academic Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Student ID</Text>
          <Text style={styles.infoValue}>{profile.studentId}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Year Level</Text>
          <Text style={styles.infoValue}>{profile.yearLevel}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Major</Text>
          <Text style={styles.infoValue}>{profile.major}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skills</Text>
        <View style={styles.skillsContainer}>
          {profile.skills.map((skill, index) => (
            <View key={index} style={styles.skillBadge}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
        </View>
      </View>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    alignItems: 'center',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    color: '#666666',
  },
  nameContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: '#666666',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066CC',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  statCard: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#666666',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666666',
  },
  infoValue: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    color: '#0066CC',
    fontSize: 14,
    fontWeight: '500',
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 16,
    color: '#333333',
  },
  logoutText: {
    color: '#F44336',
  },
});

export default ProfileScreen;
