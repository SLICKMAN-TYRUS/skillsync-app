// screens/ReviewApplicationsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import HeaderBack from '../../components/HeaderBack';
import { providerApi } from '../services/api';
import { ensureTestAuth } from '../../services/devAuth';

export default function ReviewApplicationsScreen({ route }) {
  const { gigId } = route.params;
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionsPending, setActionsPending] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        if (((typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.ALLOW_DEV_TOKENS === 'true')) {
          await ensureTestAuth('firebase-uid-provider1', 'provider');
        }
        const apps = await providerApi.getApplicationsForGig(gigId);
        if (!mounted) return;
        setApplications(Array.isArray(apps) ? apps : (apps.items || []));
      } catch (err) {
        console.error('Failed to load applications', err);
        setError(err?.message || 'Failed to load applications');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [gigId]);

  const handleAction = (appId, action) => {
    Alert.alert(
      action === 'select' ? 'Accept application' : 'Reject application',
      `Are you sure you want to ${action === 'select' ? 'accept' : 'reject'} this application?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'select' ? 'Accept' : 'Reject',
          style: action === 'select' ? 'default' : 'destructive',
          onPress: async () => {
            setActionsPending((s) => ({ ...s, [appId]: true }));
            const prev = applications.slice();
            try {
              if (((typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.ALLOW_DEV_TOKENS === 'true')) {
                await ensureTestAuth('firebase-uid-provider1', 'provider');
              }
              if (action === 'select') {
                await providerApi.selectApplication(appId);
              } else {
                await providerApi.rejectApplication(appId);
              }
              // Optimistically update UI: mark status for the application
              setApplications((list) => list.map((a) => (a.id === appId ? { ...a, status: action === 'select' ? 'accepted' : 'rejected' } : a)));
            } catch (err) {
              console.error('Action failed', err);
              setError(err?.message || 'Action failed');
              setApplications(prev);
            } finally {
              setActionsPending((s) => ({ ...s, [appId]: false }));
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <HeaderBack title="Review Applications" backTo="ProviderDashboard" />
        <Text style={styles.header}>Review Applications</Text>
        {loading && <ActivityIndicator size="large" color="#0077cc" />}
        {error ? <Text style={{ color: '#c53030', textAlign: 'center' }}>{error}</Text> : null}

        {applications.map((applicant) => (
          <View key={applicant.id} style={styles.card}>
            <Text style={styles.name}>{applicant.student?.name || applicant.student_name || applicant.student_id}</Text>
            <Text style={styles.message}>{applicant.notes || applicant.message || ''}</Text>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[
                  styles.button,
                  applicant.status === 'accepted' && styles.accepted,
                ]}
                disabled={actionsPending[applicant.id]}
                onPress={() => handleAction(applicant.id, 'select')}
              >
                <Text style={styles.buttonText}>{actionsPending[applicant.id] ? '...' : 'Accept'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  applicant.status === 'rejected' && styles.rejected,
                ]}
                disabled={actionsPending[applicant.id]}
                onPress={() => handleAction(applicant.id, 'reject')}
              >
                <Text style={styles.buttonText}>{actionsPending[applicant.id] ? '...' : 'Reject'}</Text>
              </TouchableOpacity>
            </View>

            {applicant.status && (
              <Text style={styles.status}>Status: {applicant.status}</Text>
            )}
          </View>
        ))}
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
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0077cc',
    marginBottom: 6,
  },
  message: {
    fontSize: 14,
    color: '#444',
    marginBottom: 10,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#0077cc',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  accepted: {
    backgroundColor: '#28a745',
  },
  rejected: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  status: {
    marginTop: 10,
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
  },
});