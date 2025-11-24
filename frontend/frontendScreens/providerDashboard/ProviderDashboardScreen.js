// screens/ProviderDashboardScreen.js
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import HeaderBack from '../../components/HeaderBack';
import { useNavigation } from '@react-navigation/native';
import { providerApi } from '../services/api';
import { ensureTestAuth } from '../../services/devAuth';
import { getSharedEventStream } from '../../services/eventStream';
import { pushToast } from '../../services/toastStore';

const AVATAR_PLACEHOLDER = 'https://placehold.co/64x64/0b72b9/ffffff?text=P';

export default function ProviderDashboardScreen() {
  const navigation = useNavigation();
  const [routes, setRoutes] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState(null);
  const [metrics, setMetrics] = useState({
    open: 0,
    pendingApproval: 0,
    applicants: 0,
    completed: 0,
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadProviderData = useCallback(
    async ({ silent } = {}) => {
      try {
        if (((typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.ALLOW_DEV_TOKENS === 'true')) {
          await ensureTestAuth('firebase-uid-provider1', 'provider');
        }
        if (!silent) {
          setLoading(true);
        }
        const gigsData = await providerApi.getGigs();
        if (!mountedRef.current) {
          return;
        }
        const gigsArray = Array.isArray(gigsData) ? gigsData : gigsData?.items || [];
        setGigs(gigsArray);

        const openApproved = gigsArray.filter(
          (g) => (g.approval_status || '').toLowerCase() === 'approved' && (g.status || '').toLowerCase() === 'open'
        ).length;
        const pending = gigsArray.filter((g) => (g.approval_status || '').toLowerCase() === 'pending').length;
        const applicants = gigsArray.reduce((sum, g) => sum + (g.application_count || 0), 0);
        const completed = gigsArray.filter((g) => (g.status || '').toLowerCase() === 'completed').length;

        setMetrics({
          open: openApproved,
          pendingApproval: pending,
          applicants,
          completed,
        });
        setError('');
      } catch (e) {
        console.error('Failed to fetch provider gigs', e);
        if (!mountedRef.current) {
          return;
        }
        if (!silent) {
          setError('Unable to load your gigs. Please try again soon.');
        }
      } finally {
        if (!mountedRef.current) {
          return;
        }
        if (!silent) {
          setLoading(false);
        }
      }
    },
    []
  );
  useEffect(() => {
    loadProviderData();
  }, [loadProviderData]);

  useEffect(() => {
    const client = getSharedEventStream();
    if (!client) {
      return undefined;
    }

    const offMetrics = client.on('metrics_changed', (payload = {}) => {
      if (payload?.scope === 'provider') {
        loadProviderData({ silent: true });
      }
    });

    const offApproved = client.on('gig_approved', (payload = {}) => {
      const title = payload?.title || 'Your gig';
      pushToast({ type: 'success', message: `${title} approved.` });
      loadProviderData({ silent: true });
    });

    const offRejected = client.on('gig_rejected', (payload = {}) => {
      const title = payload?.title || 'Your gig';
      const reason = payload?.reason ? ` Reason: ${payload.reason}` : '';
      pushToast({ type: 'warning', message: `${title} rejected.${reason}` });
      loadProviderData({ silent: true });
    });

    return () => {
      offMetrics();
      offApproved();
      offRejected();
    };
  }, [loadProviderData]);

  const renderStatusBadge = (status) => {
    const normalized = (status || '').toLowerCase();
    const labelMap = {
      open: 'Open',
      in_progress: 'In Progress',
      completed: 'Completed',
      closed: 'Closed',
      cancelled: 'Cancelled',
    };
    const colorMap = {
      open: '#1976D2',
      in_progress: '#FF9800',
      completed: '#4CAF50',
      closed: '#9E9E9E',
      cancelled: '#D32F2F',
    };
    const color = colorMap[normalized] || '#2196F3';
    const label = labelMap[normalized] || (status || 'Open');
    return (
      <View style={[styles.statusBadge, { backgroundColor: color }]}> 
        <Text style={styles.statusText}>{label}</Text>
      </View>
    );
  };

  const renderApprovalBadge = (approval) => {
    const normalized = (approval || '').toLowerCase();
    const color = normalized === 'approved' ? '#4CAF50' : normalized === 'rejected' ? '#D32F2F' : '#FFB300';
    const label = normalized ? normalized.replace('_', ' ') : 'pending';
    return (
      <View style={[styles.approvalBadge, { backgroundColor: color }]}> 
        <Text style={styles.approvalText}>{label.toUpperCase()}</Text>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <HeaderBack title="Provider Dashboard" backTo="Login" />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={{ uri: 'https://placehold.co/64x64/0b72b9/ffffff?text=P' }} style={styles.avatar} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.providerName}>Provider Name</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="star" size={14} color="#FFD700" />
              <Text style={styles.smallText}> 4.8 • Kigali</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.headerAction}>
          <Icon name="settings" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#EAF6FF' }]}>
              <Icon name="work" size={28} color="#0b72b9" />
              <Text style={styles.statValue}>{metrics.open}</Text>
              <Text style={styles.statLabel}>Open & Approved</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#FFF5EB' }]}>
              <Icon name="group" size={28} color="#ff8a00" />
              <Text style={styles.statValue}>{metrics.applicants}</Text>
              <Text style={styles.statLabel}>Total Applicants</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.managementCard} onPress={() => navigation.navigate('ManageGigs')}>
            <View style={styles.managementIconWrap}>
              <Icon name="dashboard" size={28} color="#fff" />
            </View>
            <View style={{ flex: 1, marginHorizontal: 14 }}>
              <Text style={styles.managementTitle}>Gig Management</Text>
              <Text style={styles.managementSubtitle}>
                Review approvals, monitor statuses, and prune outdated gigs in one place.
              </Text>
            </View>
            <View style={styles.managementBadge}>
              <Text style={styles.managementBadgeText}>{metrics.pendingApproval}</Text>
              <Text style={styles.managementBadgeHint}>pending</Text>
            </View>
          </TouchableOpacity>

        <Text style={styles.sectionTitle}>Your Gigs</Text>
        {error ? <Text style={{ color: '#c53030', marginBottom: 12 }}>{error}</Text> : null}
        {gigs.map((gig) => (
          <View key={gig.id} style={styles.gigCard}>
            <View style={styles.gigLeft}>
              <View style={styles.gigIconWrap}>
                <Icon name="work-outline" size={28} color="#0b72b9" />
              </View>
            </View>
            <View style={styles.gigBody}>
              <Text style={styles.gigTitle}>{gig.title}</Text>
              <View style={styles.rowBetween}>
                {renderStatusBadge(gig.status)}
                <Text style={styles.smallTextDark}>{gig.application_count || 0} applicants</Text>
              </View>
              <View style={styles.rowBetween}>
                {renderApprovalBadge(gig.approval_status)}
                <Text style={styles.smallTextDark}>{gig.deadline_display || gig.deadline || 'Flexible timeline'}</Text>
              </View>
              <View style={styles.gigActions}>
                <TouchableOpacity style={styles.actionIcon} onPress={() => navigation.navigate('ReviewApplications', { gigId: gig.id })}>
                  <View style={[styles.iconCircle, { backgroundColor: '#EAF4FF' }]}>
                    <Icon name="preview" size={20} color="#0b72b9" />
                  </View>
                  <Text style={styles.iconLabel}>Review</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionIcon} onPress={() => navigation.navigate('RateStudents', { gigId: gig.id })}>
                  <View style={[styles.iconCircle, { backgroundColor: '#FFF6E8' }]}>
                    <Icon name="thumb-up" size={20} color="#ff8a00" />
                  </View>
                  <Text style={styles.iconLabel}>Rate</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionIcon} onPress={() => navigation.navigate('ChatScreen', { sender: 'Student' })}>
                  <View style={[styles.iconCircle, { backgroundColor: '#EAF9EE' }]}>
                    <Icon name="chat" size={20} color="#1e8e3e" />
                  </View>
                  <Text style={styles.iconLabel}>Chat</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          {routes.length > 0 ? (
            routes.map((r) => (
              <TouchableOpacity key={r.id} style={styles.actionCard} onPress={() => navigation.navigate(r.path.includes('/provider/post') ? 'PostGig' : r.path.includes('/provider/manage') ? 'ManageGigs' : 'ProviderDashboard')}>
                <Icon name="bolt" size={20} color="#fff" />
                <Text style={styles.actionCardText}>{r.title}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('PostGig')}>
              <Icon name="add-circle" size={20} color="#fff" />
              <Text style={styles.actionCardText}>Post New Gig</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('PostGig')}>
        <Icon name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7FB' },
  header: {
    height: 120,
    backgroundColor: '#0b72b9',
    paddingHorizontal: 18,
    paddingTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff' },
  providerName: { color: '#fff', fontSize: 18, fontWeight: '800' },
  smallText: { color: '#DFF3FF', fontSize: 12 },
  smallTextDark: { color: '#677287', fontSize: 12 },
  headerAction: { padding: 8 },

  container: { padding: 18, paddingBottom: 120 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statCard: { flex: 1, marginHorizontal: 6, borderRadius: 12, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  statValue: { fontSize: 18, fontWeight: '800', marginTop: 8, color: '#083b66' },
  statLabel: { fontSize: 12, color: '#556270' },

  managementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0b72b9',
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 6,
    marginBottom: 20,
    shadowColor: '#0b72b9',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  managementIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#0a5ea1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  managementTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  managementSubtitle: { color: '#D1E9FF', fontSize: 12, marginTop: 6, lineHeight: 18 },
  managementBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a5ea1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  managementBadgeText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  managementBadgeHint: { color: '#D1E9FF', fontSize: 11, textTransform: 'uppercase', marginTop: 2, letterSpacing: 1 },

  sectionTitle: { fontSize: 16, fontWeight: '800', marginVertical: 14, color: '#2b3944' },

  gigCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  gigLeft: { width: 60, alignItems: 'center', justifyContent: 'center' },
  gigIconWrap: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#EAF6FF', alignItems: 'center', justifyContent: 'center' },
  gigBody: { flex: 1, paddingLeft: 12 },
  gigTitle: { fontSize: 15, fontWeight: '800', color: '#0b72b9' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  approvalBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  approvalText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  gigActions: { flexDirection: 'row', marginTop: 12 },
  actionIcon: { alignItems: 'center', marginRight: 18 },
  iconCircle: { width: 50, height: 50, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 8, elevation: 2 },
  iconLabel: { fontSize: 12, color: '#333', fontWeight: '700' },

  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionCard: { backgroundColor: '#0b72b9', padding: 14, borderRadius: 12, marginBottom: 12, width: '48%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  actionCardText: { color: '#fff', marginLeft: 8, fontWeight: '800' },

  fab: { position: 'absolute', right: 20, bottom: 24, backgroundColor: '#0b72b9', width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', elevation: 6 },
});