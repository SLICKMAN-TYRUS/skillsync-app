import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ErrorBanner from '../../components/ErrorBanner';
import HeaderBack from '../../components/HeaderBack';
import { useNavigation } from '@react-navigation/native';
import { studentApi } from '../../services/api';
import { useEffect, useState } from 'react';

export default function StudentDashboardScreen() {
  const navigation = useNavigation();
  const [routes, setRoutes] = useState([]);
  const [error, setError] = useState('');
  const [applicationCount, setApplicationCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const navigateTo = (screen) => {
    navigation.navigate(screen);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // Fetch student's applications to show count
        const apps = await studentApi.getMyApplications();
        if (!mounted) return;
        const appsList = Array.isArray(apps) ? apps : (apps.items || []);
        setApplicationCount(appsList.length);
      } catch (e) {
        console.warn('Failed to fetch applications', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <HeaderBack title="Student Dashboard" backTo="Login" />
      <Text style={styles.subheading}>Browse gigs, manage applications, and stay connected.</Text>

      <ErrorBanner message={error} onClose={() => setError('')} />
      <View style={styles.grid}>
        <IconButton icon={<Ionicons name="briefcase-outline" size={28} color="#0077cc" />} label="Browse Gigs" onPress={() => navigateTo('GigsScreen')} />
        <IconButton icon={<Ionicons name="document-text-outline" size={28} color="#0077cc" />} label="My Applications" onPress={() => navigateTo('MyApplicationsScreen')} />
        <IconButton icon={<Ionicons name="chatbox-outline" size={28} color="#0077cc" />} label="Inbox" onPress={() => navigateTo('InboxScreen')} />
        <IconButton icon={<Ionicons name="notifications-outline" size={28} color="#0077cc" />} label="Notifications" onPress={() => navigateTo('NotificationsScreen')} />
        <IconButton icon={<Ionicons name="checkmark-done-outline" size={28} color="#0077cc" />} label="Completed" onPress={() => navigateTo('CompletedGigsScreen')} />
        <IconButton icon={<Ionicons name="person-outline" size={28} color="#0077cc" />} label="Profile" onPress={() => navigateTo('ProfileScreen')} />
  <IconButton icon={<Ionicons name="chatbubbles-outline" size={28} color="#0077cc" />} label="General Chat" onPress={() => navigateTo('ChatScreen')} />
        <IconButton icon={<Ionicons name="star-outline" size={28} color="#0077cc" />} label="Rate Providers" onPress={() => navigateTo('RateProviderScreen')} />
      </View>

      <DashboardSection title="Quick Summary">
        {loading ? (
          <Text style={styles.placeholder}>Loading your applications...</Text>
        ) : applicationCount > 0 ? (
          <Text style={styles.placeholder}>You have {applicationCount} application{applicationCount !== 1 ? 's' : ''}. Check their status in "My Applications".</Text>
        ) : (
          <Text style={styles.placeholder}>No active applications yet. Start browsing gigs and apply with confidence.</Text>
        )}
      </DashboardSection>
    </ScrollView>
  );
}

function IconButton({ icon, label, onPress }) {
  const { width } = Dimensions.get('window');
  const isSmall = width < 420;
  return (
    <TouchableOpacity style={[styles.iconButton, isSmall && styles.iconButtonSmall]} onPress={onPress}>
      {icon}
      <Text style={styles.iconLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function DashboardSection({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#f9f9f9',
    flexGrow: 1,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0077cc',
    marginBottom: 10,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
    marginBottom: 30,
  },
  buttonGroup: {
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#0077cc',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  placeholder: {
    fontSize: 14,
    color: '#777',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  iconButton: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  iconButtonSmall: {
    width: '100%',
  },
  iconEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  iconLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});