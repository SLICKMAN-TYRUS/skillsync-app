// screens/CompletedGigsScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Celebrate your shipped work</Text>
          <Text style={styles.heroSubtitle}>
            Capture outcome notes, gather provider ratings, and turn these projects into standout portfolio evidence.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#1D4ED8" style={styles.loadingIndicator} />
        ) : completed.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="flag-outline" size={64} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No completed gigs yet</Text>
            <Text style={styles.emptySubtitle}>
              Once gigs are marked complete, they’ll land here for easy access to feedback and ratings.
            </Text>
          </View>
        ) : (
          completed.map((item) => {
            const gig = item.gig || {};
            const completedDate = item.updated_at || item.selected_at || item.applied_at;
            const formattedDate = completedDate
              ? new Date(completedDate).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : 'Date unavailable';

            return (
              <View key={gig.id || item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.title}>{gig.title || 'Completed gig'}</Text>
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={18} color="#15803D" />
                    <Text style={styles.completedText}>Completed</Text>
                  </View>
                </View>
                <Text style={styles.meta}>Provider: {gig.provider_name || gig.provider?.name || 'Provider'}</Text>
                <Text style={styles.meta}>Wrapped on {formattedDate}</Text>
                {gig.description ? (
                  <Text style={styles.summary} numberOfLines={3}>
                    {gig.description}
                  </Text>
                ) : null}

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
    paddingVertical: 40,
    backgroundColor: '#F3F4FF',
  },
  container: {
    width: '92%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  heroCard: {
    backgroundColor: '#1D4ED8',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    lineHeight: 20,
  },
  loadingIndicator: {
    marginTop: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  meta: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 4,
  },
  summary: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
    marginTop: 8,
  },
  button: {
    backgroundColor: '#1D4ED8',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  completedText: {
    color: '#15803D',
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 6,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    alignItems: 'center',
    paddingVertical: 52,
    paddingHorizontal: 28,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
    marginTop: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 18,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
});