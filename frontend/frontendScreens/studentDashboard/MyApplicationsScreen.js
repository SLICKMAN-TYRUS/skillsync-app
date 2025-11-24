import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { studentApi } from '../services/api';
import { ensureTestAuth } from '../../services/devAuth';
import ErrorBanner from '../../components/ErrorBanner';
import GigCard from '../../components/GigCard';

export default function MyApplicationsScreen({ navigation }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sortNewest, setSortNewest] = useState(true);

  const statusStyles = useMemo(
    () => ({
      accepted: { color: '#15803D', background: '#DCFCE7' },
      completed: { color: '#1D4ED8', background: '#E0EAFF' },
      submitted: { color: '#B45309', background: '#FEF3C7' },
      pending: { color: '#9333EA', background: '#F3E8FF' },
      rejected: { color: '#DC2626', background: '#FEE2E2' },
      withdrawn: { color: '#475569', background: '#E2E8F0' },
    }),
    [],
  );

  const load = async () => {
    try {
      if (((typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.ALLOW_DEV_TOKENS === 'true')) {
        await ensureTestAuth('firebase-uid-student1', 'student');
      }
      const data = await studentApi.getMyApplications();
      setApps(data.items || data);
    } catch (err) {
      setError(err.message || JSON.stringify(err));
    }
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        setLoading(true);
        await load();
      } finally {
        if (mounted) setLoading(false);
      }
    };
    init();
    return () => (mounted = false);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const sortedApps = apps.slice().sort((a, b) => {
    const ta = a.created_at || a.applied_at || a.timestamp || a.createdAt || '';
    const tb = b.created_at || b.applied_at || b.timestamp || b.createdAt || '';
    if (!ta && !tb) return 0;
    if (!ta) return 1;
    if (!tb) return -1;
    return sortNewest ? (new Date(tb) - new Date(ta)) : (new Date(ta) - new Date(tb));
  });

  if (loading) {
    return <ActivityIndicator size="large" style={styles.loadingIndicator} color="#2563EB" />;
  }

  const renderItem = ({ item }) => {
    const gig = item.gig || item.gig_details || null;
    const rawStatus = (item.status || '').toLowerCase();
    const statusMeta = statusStyles[rawStatus] || statusStyles.pending;
    const appliedAt = item.created_at || item.applied_at || item.timestamp || item.createdAt;
    const appliedLabel = appliedAt ? new Date(appliedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date pending';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('GigDetailScreen', { gigId: gig?.id || item.gig_id, gig })}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{gig?.title || `Gig #${item.gig_id}`}</Text>
          <View
            style={[styles.statusPill, { backgroundColor: statusMeta.background }]}
          >
            <Text style={[styles.statusText, { color: statusMeta.color }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.cardMeta}>
          Applied {appliedLabel}
        </Text>
        {gig?.location ? <Text style={styles.cardMeta}>{gig.location}</Text> : null}
        {gig ? (
          <Text style={styles.cardSummary} numberOfLines={3}>
            {gig.description}
          </Text>
        ) : null}
        <View style={styles.cardFooter}>
          <Text style={styles.cardFooterText}>Tap to view status & next steps</Text>
          <Ionicons name="chevron-forward" size={18} color="#1D4ED8" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      {error ? <ErrorBanner message={error} /> : null}
      <FlatList
        data={sortedApps}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
        ListHeaderComponent={
          <View style={styles.heroCard}>
            <View style={styles.heroHeaderRow}>
              <Text style={styles.heroTitle}>My Applications</Text>
              <TouchableOpacity onPress={() => setSortNewest(!sortNewest)} style={styles.sortToggle}>
                <Ionicons name="swap-vertical" size={18} color="#1D4ED8" />
                <Text style={styles.sortToggleText}>{sortNewest ? 'Newest first' : 'Oldest first'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.heroSubtitle}>
              Track progress and stay ready to respond. Keep an eye on accepted and completed gigs so you can submit ratings promptly.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-circle-outline" size={64} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No applications yet</Text>
            <Text style={styles.emptySubtitle}>
              Bookmark gigs that excite you and submit at least one application to build momentum.
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate('GigsScreen')}>
              <Text style={styles.emptyButtonText}>Browse gigs</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F3F4FF',
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 32,
  },
  loadingIndicator: {
    flex: 1,
    marginTop: 48,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#1E293B',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  sortToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0EAFF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sortToggleText: {
    marginLeft: 6,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 12,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  cardMeta: {
    fontSize: 13,
    color: '#475569',
    marginTop: 4,
  },
  cardSummary: {
    fontSize: 13,
    color: '#334155',
    marginTop: 10,
    lineHeight: 19,
  },
  cardFooter: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardFooterText: {
    fontSize: 13,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 18,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
