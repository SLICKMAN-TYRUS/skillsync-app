// screens/CompletedGigsScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import ErrorBanner from '../../components/ErrorBanner';
import HeaderBack from '../../components/HeaderBack';
import { useNavigation } from '@react-navigation/native';
import { studentApi } from '../services/api';
import { ensureTestAuth } from '../../services/devAuth';

export default function CompletedGigsScreen() {
  const navigation = useNavigation();
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        if (((typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.ALLOW_DEV_TOKENS === 'true')) {
          await ensureTestAuth('firebase-uid-student1', 'student');
        }
        const apps = await studentApi.getMyApplications();
        if (!mounted) return;
        const list = Array.isArray(apps) ? apps : (apps.items || []);
        const completedApps = list.filter((app) => (app.status || '').toLowerCase() === 'completed');
        setCompleted(completedApps);
      } catch (err) {
        console.error('Failed to load completed gigs', err);
        if (mounted) setError(err?.message || 'Failed to load completed gigs');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <HeaderBack title="Completed Gigs" backTo="StudentDashboard" />
        <ErrorBanner message={error} onClose={() => setError('')} />
        <Text style={styles.header}>Completed Gigs</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#0077cc" style={{ marginTop: 24 }} />
        ) : completed.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#555' }}>You have not completed any gigs yet.</Text>
        ) : (
          completed.map((item) => {
            const gig = item.gig || {};
            const completedDate = item.updated_at || item.selected_at || item.applied_at;
            return (
              <View key={gig.id || item.id} style={styles.card}>
                <Text style={styles.title}>{gig.title}</Text>
                <Text style={styles.meta}>Provider: {gig.provider_name || gig.provider?.name || 'Provider'}</Text>
                <Text style={styles.meta}>
                  Completed: {completedDate ? new Date(completedDate).toDateString() : 'Date unavailable'}
                </Text>

                <TouchableOpacity
                  style={styles.button}
                  onPress={() =>
                    navigation.navigate('RateProviderScreen', {
                      providerId: gig.provider_id,
                      gigTitle: gig.title,
                    })
                  }
                >
                  <Text style={styles.buttonText}>Rate Provider</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
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
  card: {
    backgroundColor: '#f2f8ff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0077cc',
    marginBottom: 6,
  },
  meta: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
  },
  rated: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '600',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#0077cc',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});