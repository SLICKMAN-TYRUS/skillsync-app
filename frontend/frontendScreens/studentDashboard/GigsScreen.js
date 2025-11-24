// screens/GigsScreen.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import ErrorBanner from '../../components/ErrorBanner';
import HeaderBack from '../../components/HeaderBack';
import { useNavigation } from '@react-navigation/native';
import { fetchGigs } from '../services/api';
import { ensureTestAuth } from '../../services/devAuth';
import GigCard from '../../components/GigCard';

export default function GigsScreen() {
  const navigation = useNavigation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const quickFilters = useMemo(
    () => ['Latest', 'Remote friendly', 'Design', 'Data', 'Short-term'],
    [],
  );

  const isDevAuthEnabled =
    (typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.ALLOW_DEV_TOKENS === 'true';

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        if (isDevAuthEnabled) {
          await ensureTestAuth('firebase-uid-student1', 'student');
        }
        const data = await fetchGigs();
        if (!mounted) return;
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load gigs', err);
        setError(err?.message || 'Failed to load gigs');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      if (isDevAuthEnabled) {
        await ensureTestAuth('firebase-uid-student1', 'student');
      }
      const data = await fetchGigs();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to refresh gigs', err);
      setError(err?.message || 'Failed to refresh gigs');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#2563EB" />
      }
    >
      <View style={styles.container}>
        <HeaderBack title="Browse Gigs" backTo="StudentDashboard" />
        <ErrorBanner message={error} onClose={() => setError('')} />

        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Student Opportunities</Text>
          </View>
          <Text style={styles.heroTitle}>Discover Projects Tailored For You</Text>
          <Text style={styles.heroSubtitle}>
            Apply to curated gigs from industry partners and build experience while studying. Each listing highlights the key skills,
            requirements, and deliverables so you can decide fast.
          </Text>
          <View style={styles.heroInsightsRow}>
            <View style={styles.heroInsight}>
              <Text style={styles.heroInsightLabel}>Avg. response</Text>
              <Text style={styles.heroInsightValue}>48 hrs</Text>
              <Text style={styles.heroInsightHint}>Students hear back quickly from curated partners.</Text>
            </View>
            <View style={styles.heroInsight}>
              <Text style={styles.heroInsightLabel}>Fresh this week</Text>
              <Text style={styles.heroInsightValue}>12 gigs</Text>
              <Text style={styles.heroInsightHint}>Browse new Kigali briefs posted after Monday.</Text>
            </View>
          </View>
          <View style={styles.heroActions}>
            <TouchableOpacity
              style={[styles.heroButton, styles.heroPrimary]}
              onPress={() => navigation.navigate('SavedGigsScreen')}
            >
              <Text style={styles.heroPrimaryText}>View Saved Gigs</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.heroButton, styles.heroSecondary]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.heroSecondaryText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {quickFilters.map((label) => (
            <View key={label} style={styles.filterChip}>
              <Text style={styles.filterChipText}>{label}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.listHeader}>
          <Text style={styles.listHeaderTitle}>Open Gigs</Text>
          <Text style={styles.listHeaderCaption}>
            {loading ? 'Loading current opportunities…' : `${items.length} opportunities available`}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Bringing the latest gigs to you…</Text>
          </View>
        ) : null}

        {!loading && items.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nothing posted just yet</Text>
            <Text style={styles.emptyText}>
              Providers are preparing new collaborations. Check your saved gigs or refresh in a bit to see new matches.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('SavedGigsScreen')}
            >
              <Text style={styles.emptyButtonText}>Review Saved Gigs</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.gigList}>
          {!loading &&
            items.map((gig) => (
              <View key={gig.id} style={styles.gigCardWrapper}>
                <GigCard
                  gig={gig}
                  onPress={(detail) => {
                    try {
                      navigation.navigate('GigDetailScreen', { gig: detail, gigId: detail.id });
                    } catch (err) {
                      console.error('Navigation error', err);
                      setError('Unable to open gig details');
                    }
                  }}
                />
              </View>
            ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'stretch',
    paddingVertical: 56,
    paddingHorizontal: 28,
    backgroundColor: '#F3F4FF',
  },
  container: {
    width: '100%',
    maxWidth: 1080,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 32,
    paddingVertical: 36,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
  },
  heroCard: {
    backgroundColor: '#1D4ED8',
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 36,
    marginBottom: 28,
    overflow: 'hidden',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginBottom: 14,
  },
  heroBadgeText: {
    color: '#E0E7FF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#E0E7FF',
    lineHeight: 22,
    marginBottom: 22,
  },
  heroInsightsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -10,
    marginBottom: 12,
  },
  heroInsight: {
    flexBasis: '48%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  heroInsightLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  heroInsightValue: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: 6,
  },
  heroInsightHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.78)',
    marginTop: 6,
    lineHeight: 18,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  heroButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    marginHorizontal: 6,
    marginVertical: 6,
  },
  heroPrimary: {
    backgroundColor: '#FFFFFF',
  },
  heroPrimaryText: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  heroSecondary: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  heroSecondaryText: {
    color: '#E0E7FF',
    fontWeight: '600',
  },
  listHeader: {
    marginBottom: 16,
  },
  listHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  listHeaderCaption: {
    fontSize: 13,
    color: '#475569',
    marginTop: 4,
  },
  filterRow: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 18,
  },
  filterChip: {
    backgroundColor: '#E0EAFF',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  filterChipText: {
    color: '#1E3A8A',
    fontWeight: '600',
    fontSize: 13,
  },
  loadingArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 13,
    color: '#475569',
  },
  emptyState: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingVertical: 34,
    paddingHorizontal: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 18,
    lineHeight: 21,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  gigList: {
    flexDirection: 'column',
  },
  gigCardWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 4,
    shadowColor: '#0f172a',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    marginBottom: 18,
  },
});