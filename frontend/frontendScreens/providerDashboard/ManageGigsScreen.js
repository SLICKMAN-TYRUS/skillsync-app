// screens/ManageGigsScreen.js
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { providerApi } from '../services/api';
import { ensureTestAuth } from '../../services/devAuth';
import { Picker } from '@react-native-picker/picker';
import { pushToast } from '../../services/toastStore';

export default function ManageGigsScreen() {
  const navigation = useNavigation();
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const mountedRef = useRef(true);

  const loadGigs = useCallback(
    async ({ silent } = {}) => {
      try {
        if (!silent) {
          setLoading(true);
        }
        if (((typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.ALLOW_DEV_TOKENS === 'true')) {
          await ensureTestAuth('firebase-uid-provider1', 'provider');
        }
        const data = await providerApi.getGigs();
        if (!mountedRef.current) {
          return;
        }
        setGigs(Array.isArray(data) ? data : data?.items || []);
        setError('');
      } catch (err) {
        console.error('Failed to load provider gigs', err);
        if (!mountedRef.current) {
          return;
        }
        setError(err?.message || 'Failed to load gigs');
      } finally {
        if (!mountedRef.current) {
          return;
        }
        if (!silent) {
          setLoading(false);
        }
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    mountedRef.current = true;
    loadGigs();
    return () => {
      mountedRef.current = false;
    };
  }, [loadGigs]);

  const pendingCount = useMemo(
    () => gigs.filter((gig) => (gig.approval_status || '').toLowerCase() === 'pending').length,
    [gigs],
  );

  const approvedCount = useMemo(
    () => gigs.filter((gig) => (gig.approval_status || '').toLowerCase() === 'approved').length,
    [gigs],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadGigs({ silent: true });
  }, [loadGigs]);

  const allowedStatuses = [
    { label: 'Open', value: 'open' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
    { label: 'Closed', value: 'closed' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  const updateStatus = async (id, newStatus) => {
    const prev = gigs.slice();
    setGigs((g) => g.map((gig) => (gig.id === id ? { ...gig, status: newStatus } : gig)));
    try {
      if (((typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.ALLOW_DEV_TOKENS === 'true')) {
        await ensureTestAuth('firebase-uid-provider1', 'provider');
      }
      await providerApi.updateGig(id, { status: newStatus });
    } catch (err) {
      console.error('Failed to update status', err);
      setError(err?.message || 'Failed to update status');
      setGigs(prev);
    }
  };

  const performDeleteGig = useCallback(
    async (id) => {
      const prev = gigs.slice();
      setGigs((current) => current.filter((gig) => gig.id !== id));
      try {
        if (((typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.ALLOW_DEV_TOKENS === 'true')) {
          await ensureTestAuth('firebase-uid-provider1', 'provider');
        }
        await providerApi.deleteGig(id);
        pushToast({ type: 'success', message: 'Gig deleted.' });
        await loadGigs({ silent: true });
      } catch (err) {
        console.error('Delete failed', err);
        setError(err?.message || 'Failed to delete gig');
        setGigs(() => prev);
        pushToast({ type: 'error', message: 'Delete failed. Please try again.' });
      }
    },
    [gigs, loadGigs],
  );

  const confirmDeleteGig = (gig) => {
    const proceed = () => performDeleteGig(gig.id);
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm(`Delete "${gig.title}"? This cannot be undone.`) : false;
      if (confirmed) {
        proceed();
      }
      return;
    }
    Alert.alert('Delete gig', 'Are you sure you want to delete this gig?', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: proceed },
    ]);
  };

  const renderStatusBadge = (value) => {
    const normalized = (value || '').toLowerCase();
    const colorMap = {
      open: '#2563EB',
      in_progress: '#F59E0B',
      completed: '#16A34A',
      closed: '#6B7280',
      cancelled: '#DC2626',
    };
    const labelMap = {
      open: 'Open',
      in_progress: 'In Progress',
      completed: 'Completed',
      closed: 'Closed',
      cancelled: 'Cancelled',
    };
    const color = colorMap[normalized] || '#2563EB';
    const label = labelMap[normalized] || (value || 'Open');
    return (
      <View style={[styles.badge, { backgroundColor: `${color}1A` }]}>
        <Text style={[styles.badgeText, { color }]}>{label}</Text>
      </View>
    );
  };

  const renderApprovalBadge = (value) => {
    const normalized = (value || '').toLowerCase();
    const color = normalized === 'approved' ? '#16A34A' : normalized === 'rejected' ? '#DC2626' : '#F59E0B';
    const label = normalized ? normalized.replace('_', ' ') : 'pending';
    return (
      <View style={[styles.badge, { backgroundColor: `${color}1A` }]}>
        <Text style={[styles.badgeText, { color }]}>{label.toUpperCase()}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View pointerEvents="none" style={styles.backgroundOrbs}>
        <View style={styles.orbOne} />
        <View style={styles.orbTwo} />
        <View style={styles.orbThree} />
      </View>
      <StatusBar barStyle="dark-content" backgroundColor="#F1F4FF" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl colors={["#2563EB"]} tintColor="#2563EB" refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="options-outline" size={26} color="#2B75F6" />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.heroTitle}>Gig Management</Text>
            <Text style={styles.heroSubtitle}>
              Track approvals, adjust statuses, and remove gigs that you no longer want students to view.
            </Text>
          </View>
        </View>

        <View style={styles.metricRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Gigs</Text>
            <Text style={styles.metricValue}>{gigs.length}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Pending Approval</Text>
            <Text style={styles.metricValue}>{pendingCount}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Approved</Text>
            <Text style={styles.metricValue}>{approvedCount}</Text>
          </View>
        </View>

        <View style={styles.quickActionContainer}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('PostGig')}
          >
            <View style={styles.quickIconWrap}>
              <Ionicons name="sparkles" size={20} color="#2B75F6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.quickActionTitle}>Launch something new</Text>
              <Text style={styles.quickActionSubtitle}>Post a fresh opportunity in minutes.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#2B75F6" />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('ReviewApplications')}
          >
            <View style={[styles.quickIconWrap, { backgroundColor: '#FCE7F3' }]}>
              <Ionicons name="documents" size={20} color="#DB2777" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.quickActionTitle}>Review candidates</Text>
              <Text style={styles.quickActionSubtitle}>Jump into your pending applications.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#DB2777" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Loading your gigs…</Text>
          </View>
        ) : null}

        {error ? <View style={styles.errorBanner}><Ionicons name="alert-circle" size={18} color="#DC2626" style={{ marginRight: 8 }} /><Text style={styles.errorText}>{error}</Text></View> : null}

        {!loading && gigs.length === 0 && !error ? (
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" size={56} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No gigs yet</Text>
            <Text style={styles.emptySubtitle}>Once you post opportunities, they will appear here for quick management.</Text>
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('PostGig')}
            >
              <Text style={styles.primaryButtonText}>Post A Gig</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!loading && gigs.map((gig) => {
          const isPending = (gig.approval_status || '').toLowerCase() !== 'approved';
          return (
            <View key={gig.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.title}>{gig.title}</Text>
                <TouchableOpacity style={styles.deletePill} onPress={() => confirmDeleteGig(gig)}>
                  <Ionicons name="trash-bin" size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.badgeRow}>
                {renderStatusBadge(gig.status)}
                {renderApprovalBadge(gig.approval_status)}
              </View>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={16} color="#2563EB" style={{ marginRight: 6 }} />
                  <Text style={styles.metaText}>{gig.deadline_display || gig.deadline || 'Flexible timeline'}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={16} color="#2563EB" style={{ marginRight: 6 }} />
                  <Text style={styles.metaText}>{gig.application_count || 0} applicants</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.label}>Status</Text>
                <View style={[styles.pickerContainer, isPending && styles.pickerDisabled]}>
                  <Picker
                    selectedValue={gig.status}
                    onValueChange={(value) => {
                      if (isPending) {
                        Alert.alert('Pending approval', 'You can update the gig status once it has been approved by an administrator.');
                        return;
                      }
                      updateStatus(gig.id, value);
                    }}
                    enabled={!isPending}
                    style={styles.picker}
                    dropdownIconColor="#2563EB"
                  >
                    {allowedStatuses.map((option) => (
                      <Picker.Item key={option.value} label={option.label} value={option.value} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.9}
        style={styles.fab}
        onPress={() => navigation.navigate('PostGig')}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
        <Text style={styles.fabLabel}>Create Gig</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F1F4FF' },
  backgroundOrbs: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  orbOne: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 200,
    backgroundColor: 'rgba(37, 99, 235, 0.14)',
    transform: [{ rotate: '12deg' }],
  },
  orbTwo: {
    position: 'absolute',
    top: 140,
    left: -100,
    width: 260,
    height: 260,
    borderRadius: 240,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  orbThree: {
    position: 'absolute',
    bottom: -120,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 220,
    backgroundColor: 'rgba(110, 231, 183, 0.12)',
  },
  scrollContainer: {
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 60,
  },
  heroCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 18,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#E5F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#0B72B9' },
  heroSubtitle: { fontSize: 13, color: '#4B5B76', marginTop: 6, lineHeight: 19 },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  metricLabel: { color: '#4B5B76', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 },
  metricValue: { color: '#0B3460', fontSize: 20, fontWeight: '800', marginTop: 6 },
  quickActionContainer: {
    marginBottom: 22,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 12,
  },
  quickIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E3EDFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  quickActionTitle: { fontSize: 15, fontWeight: '700', color: '#0B3460' },
  quickActionSubtitle: { fontSize: 12, color: '#4B5B76', marginTop: 2 },
  loadingState: { alignItems: 'center', marginTop: 40 },
  loadingText: { marginTop: 12, color: '#4B5B76' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  errorText: { color: '#B91C1C', fontWeight: '600', flex: 1 },
  emptyState: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 28,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
    marginTop: 24,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#0B3460', marginTop: 18 },
  emptySubtitle: { fontSize: 13, color: '#4B5B76', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  primaryButton: {
    marginTop: 20,
    backgroundColor: '#0B72B9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 16, fontWeight: '800', color: '#0B3460', flex: 1, marginRight: 12 },
  deletePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  deleteText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  badgeRow: { flexDirection: 'row', marginTop: 14 },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  badgeText: { fontWeight: '700', fontSize: 11 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  metaText: { color: '#4B5B76', fontSize: 13 },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  label: { fontSize: 14, color: '#0B3460', fontWeight: '700', marginRight: 12 },
  pickerContainer: {
    flex: 1,
    borderColor: '#D0DAF5',
    borderWidth: Platform.OS === 'android' ? 0 : 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F8FAFF',
  },
  pickerDisabled: {
    opacity: 0.65,
  },
  picker: {
    height: 42,
    width: '100%',
    color: '#0B3460',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: '#2563EB',
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 4,
  },
  fabLabel: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});